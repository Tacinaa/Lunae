import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it('setTokens() met à jour accessToken, refreshToken et user', () => {
    const user = { id: '1', email: 'test@lunae.app' };
    useAuthStore
      .getState()
      .setTokens({ accessToken: 'access', refreshToken: 'refresh', user });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access');
    expect(state.refreshToken).toBe('refresh');
    expect(state.user).toEqual(user);
  });

  it('logout() réinitialise accessToken, refreshToken et user', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: '1', email: 'test@lunae.app' },
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
