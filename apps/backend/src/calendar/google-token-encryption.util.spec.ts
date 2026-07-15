import {
  decryptGoogleToken,
  encryptGoogleToken,
} from './google-token-encryption.util.js';

describe('google-token-encryption.util', () => {
  beforeEach(() => {
    process.env['GOOGLE_TOKEN_ENCRYPTION_KEY'] = Buffer.alloc(32, 9).toString(
      'base64',
    );
  });

  afterEach(() => {
    delete process.env['GOOGLE_TOKEN_ENCRYPTION_KEY'];
  });

  it('chiffre puis déchiffre pour retrouver le token original', () => {
    const plaintext = 'ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const ciphertext = encryptGoogleToken(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decryptGoogleToken(ciphertext)).toBe(plaintext);
  });

  it('produit un chiffré différent à chaque appel (IV aléatoire)', () => {
    const plaintext = 'même refresh token';
    const a = encryptGoogleToken(plaintext);
    const b = encryptGoogleToken(plaintext);
    expect(a).not.toBe(b);
    expect(decryptGoogleToken(a)).toBe(plaintext);
    expect(decryptGoogleToken(b)).toBe(plaintext);
  });

  it('lève une erreur si la clé de chiffrement est absente', () => {
    delete process.env['GOOGLE_TOKEN_ENCRYPTION_KEY'];
    expect(() => encryptGoogleToken('x')).toThrow();
  });

  it('lève une erreur si la clé ne fait pas 32 octets', () => {
    process.env['GOOGLE_TOKEN_ENCRYPTION_KEY'] = Buffer.alloc(16, 1).toString(
      'base64',
    );
    expect(() => encryptGoogleToken('x')).toThrow();
  });
});
