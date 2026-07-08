import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, defaultValue?: string) => values[key] ?? defaultValue,
    getOrThrow: (key: string) => {
      if (values[key] === undefined) throw new Error(`Missing config ${key}`);
      return values[key];
    },
  } as unknown as ConfigService;
}

describe('MailService', () => {
  it('sans SMTP configuré (hors production) — ne jette pas, log le code', async () => {
    const service = new MailService(makeConfig({ NODE_ENV: 'development' }));
    await expect(
      service.sendOtp('test@lunae.app', '123456'),
    ).resolves.toBeUndefined();
  });

  it('sans SMTP configuré en production — jette une erreur', async () => {
    const service = new MailService(makeConfig({ NODE_ENV: 'production' }));
    await expect(service.sendOtp('test@lunae.app', '123456')).rejects.toThrow(
      'SMTP non configuré',
    );
  });
});
