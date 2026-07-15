import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  GoogleAuthPlatform,
  type ImportGoogleCalendarDto,
} from './dto/import-google-calendar.dto.js';
import { mapGoogleEventToEventInput } from './google-calendar-event-mapper.js';
import { encryptGoogleToken } from './google-token-encryption.util.js';

const IMPORT_WINDOW_DAYS = 90;
const MAX_EVENTS = 2500;

@Injectable()
export class GoogleCalendarService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async importPrimaryCalendar(userId: string, dto: ImportGoogleCalendarDto) {
    const oauth2Client = this.buildOAuthClient(dto.platform);

    const tokens = await this.exchangeCode(oauth2Client, dto);

    if (!tokens.access_token) {
      throw new BadRequestException(
        "Réponse Google invalide : aucun token d'accès reçu",
      );
    }
    oauth2Client.setCredentials(tokens);

    const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

    const primary = await calendarApi.calendarList.get({
      calendarId: 'primary',
    });
    const externalId = primary.data.id ?? 'primary';

    const calendarRecord = await this.prisma.calendar.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: 'google',
          externalId,
        },
      },
      create: {
        userId,
        source: 'google',
        externalId,
        name: primary.data.summary ?? 'Google Calendar',
        accessToken: encryptGoogleToken(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encryptGoogleToken(tokens.refresh_token)
          : null,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
      update: {
        name: primary.data.summary ?? 'Google Calendar',
        accessToken: encryptGoogleToken(tokens.access_token),
        ...(tokens.refresh_token
          ? { refreshToken: encryptGoogleToken(tokens.refresh_token) }
          : {}),
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + IMPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const eventsResponse = await calendarApi.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: windowEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: MAX_EVENTS,
    });

    const items: calendar_v3.Schema$Event[] = eventsResponse.data.items ?? [];
    const eventInputs = items
      .map((event) =>
        mapGoogleEventToEventInput(event, {
          calendarId: calendarRecord.id,
          userId,
        }),
      )
      .filter((input) => input !== null);

    if (eventInputs.length > 0) {
      await this.prisma.event.createMany({
        data: eventInputs,
        skipDuplicates: true,
      });
    }

    return {
      calendar: calendarRecord,
      importedEventCount: eventInputs.length,
    };
  }

  private async exchangeCode(
    oauth2Client: InstanceType<typeof google.auth.OAuth2>,
    dto: ImportGoogleCalendarDto,
  ) {
    try {
      const response = await oauth2Client.getToken({
        code: dto.code,
        codeVerifier: dto.codeVerifier,
        redirect_uri: dto.redirectUri,
      });
      return response.tokens;
    } catch {
      throw new BadRequestException(
        "Échec de l'échange du code d'autorisation Google",
      );
    }
  }

  private buildOAuthClient(
    platform: GoogleAuthPlatform,
  ): InstanceType<typeof google.auth.OAuth2> {
    const clientId =
      platform === GoogleAuthPlatform.android
        ? this.config.getOrThrow<string>('GOOGLE_ANDROID_CLIENT_ID')
        : this.config.getOrThrow<string>('GOOGLE_IOS_CLIENT_ID');
    return new google.auth.OAuth2({ clientId });
  }
}
