import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * `startDate`/`cycleLength`/`periodDuration` restent en clair : ils sont triés
 * (`orderBy: startDate`) et utilisés dans des calculs arithmétiques
 * (`predictNextPeriod`) directement en base/algorithme, incompatibles avec un
 * chiffrement au niveau champ. Leur protection au repos est déléguée au
 * chiffrement de l'infrastructure (disque du Postgres managé Railway/Render).
 * `notes` est en revanche du texte libre jamais trié ni calculé : il peut être
 * chiffré applicativement sans casser aucune requête.
 */
function getKey(): Buffer {
  const key = process.env['CYCLE_DATA_ENCRYPTION_KEY'];
  if (!key) {
    throw new Error(
      'CYCLE_DATA_ENCRYPTION_KEY manquant : requis pour chiffrer/déchiffrer les notes de cycle.',
    );
  }
  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'CYCLE_DATA_ENCRYPTION_KEY doit être une clé de 32 octets (AES-256) encodée en base64.',
    );
  }
  return buffer;
}

export function encryptCycleNote(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted]
    .map((buf) => buf.toString('base64'))
    .join(':');
}

export function decryptCycleNote(ciphertext: string): string {
  const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
