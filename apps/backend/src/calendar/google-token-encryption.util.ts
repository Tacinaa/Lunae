import { decrypt, encrypt, loadKey } from '../common/crypto.util.js';

/**
 * Clé séparée de CYCLE_DATA_ENCRYPTION_KEY : un compromis de l'une ne doit
 * pas exposer l'autre catégorie de données sensibles.
 */
export function encryptGoogleToken(plaintext: string): string {
  return encrypt(
    plaintext,
    loadKey('GOOGLE_TOKEN_ENCRYPTION_KEY', 'les tokens Google Calendar'),
  );
}

export function decryptGoogleToken(ciphertext: string): string {
  return decrypt(
    ciphertext,
    loadKey('GOOGLE_TOKEN_ENCRYPTION_KEY', 'les tokens Google Calendar'),
  );
}
