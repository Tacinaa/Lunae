import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthAlgorithmService {
  generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  isOtpExpired(expiresAt: Date): boolean {
    return expiresAt < new Date();
  }
}
