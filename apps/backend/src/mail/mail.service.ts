import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: config.getOrThrow<string>('SMTP_USER'),
        pass: config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(to: string, code: string): Promise<void> {
    const from = this.config.get<string>(
      'SMTP_FROM',
      'Lunae <noreply@lunae.app>',
    );
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `${code} — votre code de vérification Lunae`,
        text: `Votre code de vérification est : ${code}\n\nIl est valable 10 minutes.`,
        html: `<p>Votre code de vérification est : <strong>${code}</strong></p><p>Il est valable 10 minutes.</p>`,
      });
    } catch (err) {
      this.logger.error(`Échec envoi email à ${to}`, err);
      throw err;
    }
  }
}
