import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message[0] ?? 'Une erreur est survenue';
    if (typeof data?.message === 'string') return data.message;
  }
  return 'Une erreur est survenue, veuillez réessayer';
}
