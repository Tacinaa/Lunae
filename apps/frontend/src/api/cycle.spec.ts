import MockAdapter from 'axios-mock-adapter';
import { createCycle } from './cycle';
import { apiClient } from './client';

describe('createCycle', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('poste le payload sur /cycle et retourne le cycle créé', async () => {
    const payload = { startDate: '2026-07-01T00:00:00.000Z', cycleLength: 28, periodDuration: 5 };
    const created = { id: 'cycle-1', ...payload };
    mock.onPost('/cycle', payload).reply(201, created);

    const result = await createCycle(payload);

    expect(result).toEqual(created);
  });

  it("propage l'erreur si l'API rejette la requête", async () => {
    const payload = { startDate: '2026-07-01T00:00:00.000Z', cycleLength: 28, periodDuration: 5 };
    mock.onPost('/cycle').reply(400, { message: 'Données invalides' });

    await expect(createCycle(payload)).rejects.toBeTruthy();
  });
});
