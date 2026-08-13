import * as Sentry from '@sentry/nestjs';

// Suivi des erreurs applicatives (cf. docs/MAINTENANCE.md section 1.2). Ce fichier doit
// être importé en tout premier, avant tout autre import, dans main.ts — exigence du SDK
// Sentry pour Nest.js (instrumentation automatique des modules chargés ensuite).
//
// Reste inactif tant que le secret SENTRY_DSN n'est pas configuré, même pattern que le
// job `deploy` du pipeline CI (cf. .github/workflows/ci.yml) : pas d'erreur, juste pas de
// remontée vers Sentry.
if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] ?? 'development',
    sendDefaultPii: false,
  });
}
