import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export function loadKey(envVarName: string, purposeLabel: string): Buffer {
  const key = process.env[envVarName];
  if (!key) {
    throw new Error(
      `${envVarName} manquant : requis pour chiffrer/déchiffrer ${purposeLabel}.`,
    );
  }
  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      `${envVarName} doit être une clé de 32 octets (AES-256) encodée en base64.`,
    );
  }
  return buffer;
}

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted]
    .map((buf) => buf.toString('base64'))
    .join(':');
}

export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
