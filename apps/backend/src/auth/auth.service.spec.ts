jest.mock('../prisma/prisma.service.js');
jest.mock('../mail/mail.service.js');

import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

const makeService = () =>
  new AuthService(null as never, null as never, null as never, null as never);

describe('AuthService — logique pure', () => {
  let service: AuthService;

  beforeEach(() => {
    service = makeService();
  });

  describe('generateOtp()', () => {
    it('retourne une chaîne de 6 chiffres', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('génère des valeurs différentes à chaque appel', () => {
      const otps = Array.from({ length: 10 }, () => service.generateOtp());
      const unique = new Set(otps);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('hashPassword() / validatePassword()', () => {
    it('retourne un hash différent du mot de passe en clair', async () => {
      const hash = await service.hashPassword('monMotDePasse');
      expect(hash).not.toBe('monMotDePasse');
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('validatePassword() — bon mot de passe → true', async () => {
      const hash = await bcrypt.hash('monMotDePasse', 10);
      const result = await service.validatePassword('monMotDePasse', hash);
      expect(result).toBe(true);
    });

    it('validatePassword() — mauvais mot de passe → false', async () => {
      const hash = await bcrypt.hash('monMotDePasse', 10);
      const result = await service.validatePassword('mauvaisMotDePasse', hash);
      expect(result).toBe(false);
    });
  });

  describe('isOtpExpired()', () => {
    it('OTP dont la date dexpiration est passée → true', () => {
      const expiresAt = new Date(Date.now() - 5 * 60 * 1000);
      expect(service.isOtpExpired(expiresAt)).toBe(true);
    });

    it('OTP qui expire dans 5 minutes → false', () => {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      expect(service.isOtpExpired(expiresAt)).toBe(false);
    });
  });
});
