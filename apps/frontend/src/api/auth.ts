import type { AuthTokens } from '../store/authStore';
import { apiClient } from './client';

export type OtpType = 'email_verification' | 'login' | 'two_fa';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/register', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/login', payload);
  return data;
}

export async function verifyOtp(email: string, code: string, type: OtpType): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/auth/verify-otp', { email, code, type });
  return data;
}

export async function requestOtp(email: string, type: OtpType): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/request-otp', { email, type });
  return data;
}
