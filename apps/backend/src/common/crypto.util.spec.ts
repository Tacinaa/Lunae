import { decrypt, encrypt, loadKey } from './crypto.util.js';

describe('common/crypto.util', () => {
  const envVarName = 'TEST_ENCRYPTION_KEY';

  beforeEach(() => {
    process.env[envVarName] = Buffer.alloc(32, 7).toString('base64');
  });

  afterEach(() => {
    delete process.env[envVarName];
  });

  it('chiffre puis déchiffre pour retrouver le texte original', () => {
    const key = loadKey(envVarName, 'des données de test');
    const plaintext = 'valeur secrète';
    const ciphertext = encrypt(plaintext, key);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext, key)).toBe(plaintext);
  });

  it('produit un chiffré différent à chaque appel (IV aléatoire)', () => {
    const key = loadKey(envVarName, 'des données de test');
    const plaintext = 'même texte';
    const a = encrypt(plaintext, key);
    const b = encrypt(plaintext, key);
    expect(a).not.toBe(b);
    expect(decrypt(a, key)).toBe(plaintext);
    expect(decrypt(b, key)).toBe(plaintext);
  });

  it('lève une erreur si la variable d’environnement est absente', () => {
    delete process.env[envVarName];
    expect(() => loadKey(envVarName, 'des données de test')).toThrow();
  });

  it('lève une erreur si la clé ne fait pas 32 octets', () => {
    process.env[envVarName] = Buffer.alloc(16, 1).toString('base64');
    expect(() => loadKey(envVarName, 'des données de test')).toThrow();
  });
});
