import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

describe('apiClient — intercepteur JWT', () => {
  let mock: MockAdapter;
  let rawAxiosMock: MockAdapter;
  const refreshUrl = `${apiClient.defaults.baseURL}/auth/refresh`;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    // La requête de refresh passe par une instance axios brute (pas apiClient)
    // pour éviter une boucle infinie sur l'intercepteur de réponse ; on la mocke séparément.
    rawAxiosMock = new MockAdapter(axios);
    useAuthStore.setState({
      accessToken: 'expired-token',
      refreshToken: 'valid-refresh-token',
      user: { id: '1', email: 'test@lunae.app' },
    });
  });

  afterEach(() => {
    mock.restore();
    rawAxiosMock.restore();
  });

  it('sur 401, rafraîchit le token puis rejoue la requête d’origine', async () => {
    mock
      .onGet('/protected')
      .replyOnce(401)
      .onGet('/protected')
      .reply((config) => {
        expect(config.headers?.['Authorization']).toBe('Bearer new-access-token');
        return [200, { ok: true }];
      });
    rawAxiosMock.onPost(refreshUrl).reply(200, { accessToken: 'new-access-token' });

    const response = await apiClient.get('/protected');

    expect(response.data).toEqual({ ok: true });
    expect(useAuthStore.getState().accessToken).toBe('new-access-token');
  });

  it('si le refresh échoue, déconnecte l’utilisateur', async () => {
    mock.onGet('/protected').reply(401);
    rawAxiosMock.onPost(refreshUrl).reply(401);

    await expect(apiClient.get('/protected')).rejects.toBeTruthy();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('sans refreshToken disponible, déconnecte sans appeler /auth/refresh', async () => {
    useAuthStore.setState({ accessToken: 'expired-token', refreshToken: null, user: null });
    mock.onGet('/protected').reply(401);

    await expect(apiClient.get('/protected')).rejects.toBeTruthy();

    expect(rawAxiosMock.history.post.filter((r) => r.url === refreshUrl)).toHaveLength(0);
  });
});
