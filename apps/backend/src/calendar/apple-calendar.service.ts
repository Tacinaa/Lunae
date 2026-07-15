import { BadRequestException, Injectable } from '@nestjs/common';
import * as ical from 'node-ical';
import { createDAVClient, type DAVCalendar } from 'tsdav';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ImportAppleCalendarDto } from './dto/import-apple-calendar.dto.js';
import { mapAppleEventToEventInput } from './apple-calendar-event-mapper.js';

const IMPORT_WINDOW_DAYS = 90;
const ICLOUD_SERVER_URL = 'https://caldav.icloud.com';

@Injectable()
export class AppleCalendarService {
  constructor(private prisma: PrismaService) {}

  async importCalendars(userId: string, dto: ImportAppleCalendarDto) {
    const client = await this.connect(dto);

    let calendars: DAVCalendar[];
    try {
      calendars = await client.fetchCalendars();
    } catch {
      throw new BadRequestException(
        'Échec de la récupération des calendriers iCloud',
      );
    }

    const eventCalendars = calendars.filter((cal) =>
      cal.components?.includes('VEVENT'),
    );

    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + IMPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    let importedEventCount = 0;
    const importedCalendars = [];

    for (const cal of eventCalendars) {
      const calendarRecord = await this.prisma.calendar.upsert({
        where: {
          userId_source_externalId: {
            userId,
            source: 'apple',
            externalId: cal.url,
          },
        },
        create: {
          userId,
          source: 'apple',
          externalId: cal.url,
          name: this.displayName(cal),
          ...(cal.calendarColor ? { color: cal.calendarColor } : {}),
        },
        update: {
          name: this.displayName(cal),
        },
      });
      importedCalendars.push(calendarRecord);

      const objects = await client.fetchCalendarObjects({
        calendar: cal,
        timeRange: { start: now.toISOString(), end: windowEnd.toISOString() },
      });

      const eventInputs = objects
        .map((obj) => (typeof obj.data === 'string' ? obj.data : null))
        .filter((data): data is string => data !== null)
        .flatMap((data) => {
          const parsed = ical.sync.parseICS(data);
          return Object.values(parsed).filter(
            (component) => component?.type === 'VEVENT',
          );
        })
        .map((event) =>
          mapAppleEventToEventInput(event, {
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
        importedEventCount += eventInputs.length;
      }
    }

    return { calendars: importedCalendars, importedEventCount };
  }

  private async connect(dto: ImportAppleCalendarDto) {
    try {
      return await createDAVClient({
        serverUrl: ICLOUD_SERVER_URL,
        credentials: {
          username: dto.appleId,
          password: dto.appSpecificPassword,
        },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
      });
    } catch {
      throw new BadRequestException(
        "Identifiant Apple ou mot de passe d'application incorrect",
      );
    }
  }

  private displayName(cal: DAVCalendar): string {
    if (typeof cal.displayName === 'string' && cal.displayName.trim()) {
      return cal.displayName;
    }
    return 'Calendrier Apple';
  }
}
