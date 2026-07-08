import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly smtpConfigured: boolean;
  private readonly isProduction: boolean;

  constructor(private config: ConfigService) {
    const user = config.get<string>('SMTP_USER', '');
    const pass = config.get<string>('SMTP_PASS', '');
    this.smtpConfigured = Boolean(user && pass);
    this.isProduction = config.get<string>('NODE_ENV') === 'production';

    if (this.smtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host: config.getOrThrow<string>('SMTP_HOST'),
        port: config.getOrThrow<number>('SMTP_PORT'),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.smtpConfigured) {
      if (this.isProduction) {
        throw new Error(
          'SMTP non configuré : impossible d’envoyer un OTP en production',
        );
      }
      this.logger.warn(`SMTP non configuré — OTP pour ${to} : ${code}`);
      return;
    }

    const from = this.config.get<string>(
      'SMTP_FROM',
      'Lunae <noreply@lunae.app>',
    );
    try {
      await this.transporter!.sendMail({
        from,
        to,
        subject: `${code} — votre code de vérification Lunae`,
        text: `Votre code de vérification est : ${code}\n\nIl est valable 10 minutes.`,
        html: `<p>Votre code de vérification est : <strong>${code}</strong></p><p>Il est valable 10 minutes.</p>`,
      });
    } catch (err) {
      if (this.isProduction) throw err;
      this.logger.error(
        `Échec envoi email à ${to} — code affiché en fallback : ${code}`,
        err,
      );
    }
  }
}
