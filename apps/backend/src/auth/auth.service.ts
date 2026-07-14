import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import { OtpType } from '@prisma/client';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthAlgorithmService } from './auth-algorithm.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const OTP_ROUNDS = 10;
const OTP_TTL_MINUTES = 10;
const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private config: ConfigService,
    private algo: AuthAlgorithmService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await this.algo.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    await this.prisma.calendar.create({
      data: { userId: user.id, name: 'Personnel' },
    });

    await this.sendOtp(user.id, user.email, OtpType.email_verification);
    return { message: 'Code de vérification envoyé par email' };
  }

  async login(dto: LoginDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user?.passwordHash)
      throw new UnauthorizedException('Identifiants invalides');

    const valid = await this.algo.validatePassword(
      dto.password,
      user.passwordHash,
    );
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    await this.sendOtp(user.id, user.email, OtpType.login);
    return { message: 'Code de vérification envoyé par email' };
  }

  async verifyOtp(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, type, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new UnauthorizedException('Code invalide ou expiré');
    if (this.algo.isOtpExpired(otp.expiresAt))
      throw new UnauthorizedException('Code expiré');

    const valid = await bcrypt.compare(code, otp.code);
    if (!valid) throw new UnauthorizedException('Code invalide');

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return this.issueTokens(user.id, user.email);
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });
    const accessToken = this.signAccessToken(user.id, user.email);
    return { accessToken };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async requestOtp(email: string, type: OtpType): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.sendOtp(user.id, email, type);
    return { message: 'Nouveau code envoyé' };
  }

  private signAccessToken(userId: string, email: string): string {
    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    return this.jwt.sign(
      { sub: userId, email },
      { expiresIn: expiresIn as StringValue },
    );
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const accessToken = this.signAccessToken(userId, email);
    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    return { accessToken, refreshToken, user };
  }

  private async sendOtp(
    userId: string,
    email: string,
    type: OtpType,
  ): Promise<void> {
    const code = this.algo.generateOtp();
    const codeHash = await bcrypt.hash(code, OTP_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { userId, code: codeHash, type, expiresAt },
    });
    await this.mail.sendOtp(email, code);
  }
}
