import MockAdapter from 'axios-mock-adapter';
import { importGoogleCalendar } from './calendar';
import { apiClient } from './client';

describe('importGoogleCalendar', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('poste le payload sur /calendars/import/google et retourne le résultat', async () => {
    const payload = {
      code: 'auth-code',
      redirectUri: 'lunae://redirect',
      codeVerifier: 'verifier',
      platform: 'android' as const,
    };
    const created = {
      calendar: { id: 'cal-1', name: 'Google Calendar', color: '#6B3FA0', source: 'google', createdAt: '2026-07-15T00:00:00.000Z' },
      importedEventCount: 3,
    };
    mock.onPost('/calendars/import/google', payload).reply(201, created);

    const result = await importGoogleCalendar(payload);

    expect(result).toEqual(created);
  });

  it("propage l'erreur si l'API rejette la requête", async () => {
    const payload = {
      code: 'invalid-code',
      redirectUri: 'lunae://redirect',
      codeVerifier: 'verifier',
      platform: 'android' as const,
    };
    mock.onPost('/calendars/import/google').reply(400, { message: "Échec de l'import" });

    await expect(importGoogleCalendar(payload)).rejects.toBeTruthy();
  });
});
