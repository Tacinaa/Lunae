import { decryptCycleNote, encryptCycleNote } from './cycle-encryption.util.js';

describe('cycle-encryption.util', () => {
  beforeEach(() => {
    process.env['CYCLE_DATA_ENCRYPTION_KEY'] = Buffer.alloc(32, 7).toString(
      'base64',
    );
  });

  it('chiffre puis déchiffre pour retrouver le texte original', () => {
    const plaintext = 'Douleurs plus fortes ce mois-ci, prise de paracétamol.';
    const ciphertext = encryptCycleNote(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decryptCycleNote(ciphertext)).toBe(plaintext);
  });

  it('produit un chiffré différent à chaque appel (IV aléatoire)', () => {
    const plaintext = 'même texte';
    const a = encryptCycleNote(plaintext);
    const b = encryptCycleNote(plaintext);
    expect(a).not.toBe(b);
    expect(decryptCycleNote(a)).toBe(plaintext);
    expect(decryptCycleNote(b)).toBe(plaintext);
  });

  it('lève une erreur si la clé de chiffrement est absente', () => {
    delete process.env['CYCLE_DATA_ENCRYPTION_KEY'];
    expect(() => encryptCycleNote('x')).toThrow();
  });

  it('lève une erreur si la clé ne fait pas 32 octets', () => {
    process.env['CYCLE_DATA_ENCRYPTION_KEY'] = Buffer.alloc(16, 1).toString(
      'base64',
    );
    expect(() => encryptCycleNote('x')).toThrow();
  });
});
