import { decrypt, encrypt, loadKey } from '../common/crypto.util.js';

/**
 * `startDate`/`cycleLength`/`periodDuration` restent en clair : ils sont triés
 * (`orderBy: startDate`) et utilisés dans des calculs arithmétiques
 * (`predictNextPeriod`) directement en base/algorithme, incompatibles avec un
 * chiffrement au niveau champ. Leur protection au repos est déléguée au
 * chiffrement de l'infrastructure (disque du Postgres managé Railway/Render).
 * `notes` est en revanche du texte libre jamais trié ni calculé : il peut être
 * chiffré applicativement sans casser aucune requête.
 */
export function encryptCycleNote(plaintext: string): string {
  return encrypt(
    plaintext,
    loadKey('CYCLE_DATA_ENCRYPTION_KEY', 'les notes de cycle'),
  );
}

export function decryptCycleNote(ciphertext: string): string {
  return decrypt(
    ciphertext,
    loadKey('CYCLE_DATA_ENCRYPTION_KEY', 'les notes de cycle'),
  );
}
