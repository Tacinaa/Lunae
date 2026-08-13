# Changelog

Toutes les modifications notables de Lunae sont documentées dans ce fichier.

Le format s'appuie sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et le
projet suit un versionnage à jalons (v0.1 → v1.0) plutôt que SemVer strict pendant le MVP
(cf. `docs/TODO.md`).

## [Non publié]

## [1.1.0] — 2026-08-13

### Added
- Sonde de santé applicative `GET /health` (`@nestjs/terminus`) : connectivité PostgreSQL
  (Prisma), tas mémoire, espace disque — exclue du préfixe `api` pour rester à `/health`,
  convention attendue par les moniteurs externes (cf. `docs/MAINTENANCE.md` section 1.1)
- Intégration Sentry (backend `@sentry/nestjs`, frontend `@sentry/react-native`) pour le
  suivi des erreurs applicatives — inactive tant que `SENTRY_DSN`/`EXPO_PUBLIC_SENTRY_DSN`
  ne sont pas configurés, même logique que le job de déploiement Railway
- `.github/dependabot.yml` — surveillance hebdomadaire des dépendances npm (backend et
  frontend)
- `.github/ISSUE_TEMPLATE/bug_report.md` — modèle de consignation d'anomalie

### Fixed
- Dépendance native manquante `expo-font` (peer dependency de `@expo/vector-icons`,
  détectée via `expo-doctor` — risque de crash hors Expo Go)

## [1.0.0] — 2026-07-16 — MVP complet (CI/CD, déploiement, QA)

### Added
- `Dockerfile` multi-stage pour le backend (`node:22-slim`, `openssl` explicite pour Prisma)
- `docker-compose.yml` — PostgreSQL local pour le développement
- Configuration de déploiement Railway (`railway.json`, manuel dans `docs/DEPLOIEMENT.md`)
  — activation réelle (compte, `railway up`) hors scope Bloc 2, cf. Backlog
- Pipeline CI GitHub Actions (`.github/workflows/ci.yml`) : jobs `backend` (lint, tests,
  build) et `frontend` (lint, tests, typecheck) ; job `deploy` prêt mais inactif tant que
  le secret `RAILWAY_TOKEN` n'est pas configuré
- Seuils de couverture Jest (80%) sur les modules de logique pure (algorithmes cycle,
  auth, recommendation, mappers d'import de calendrier)
- Configuration EAS Build (`eas.json`, profils development/preview/production)
- Écran de consentement RGPD explicite avant la saisie du cycle
- `DELETE /users/me` — suppression en cascade de toutes les données utilisatrice
- Chiffrement AES-256-GCM des notes de cycle et des tokens Google (clés dédiées)
- Repère visuel de phase non-couleur sur le calendrier (segments 1 à 4 selon la position
  dans le cycle) + labels d'accessibilité enrichis (WCAG 1.4.1)

### Changed
- Extraction des fonctions pures d'`AuthService` (`hashPassword`, `validatePassword`,
  `generateOtp`, `isOtpExpired`) en `AuthAlgorithmService`, jusque-là dupliquées et jamais
  appelées directement

### Fixed
- 11 zones tactiles sous le seuil WCAG de 44×44dp (chips de catégorie, navigation du
  mini-calendrier, boutons de suggestion, onglets et actions d'invitation, formulaire
  d'import Apple Calendar)
- Script `start:prod` pointant vers un chemin de build incorrect (`dist/main.js` au lieu
  de `dist/src/main.js`)

## [0.4.0] — 2026-07-15 — Suggestions, invitations

### Added
- Module `RecommendationModule` : scoring de déplacement d'événement par catégorie et par
  phase du cycle (table dédiée par `EventType`, pas une liste universelle de phases
  défavorables), génération automatique de suggestions à la création/modification d'un
  événement
- Module `InvitationModule` : réception et réponse aux invitations (`accepted` /
  `declined` / `maybe`)
- Écran Invitations (bottom sheet, onglets Reçues / Répondues)
- Import Apple Calendar via CalDAV (`tsdav`), formulaire dédié avec identifiant + mot de
  passe d'application — non vérifié bout-en-bout sur device iOS (Expo Go SDK 57 pas
  encore disponible sur l'App Store à cette date)
- Extension d'`EventType` par catégories (`sport_intense`, `sport_leger`,
  `focus_administratif`, `creation_planification`, `social_enjeu`) pour un scoring plus
  fin que la table générique du cahier des charges

### Changed
- Bouton "Voir les suggestions" de l'écran Détail d'un événement remplacé par un bandeau
  de recommandation direct avec mini-calendrier de créneaux favorables (UX jugée
  meilleure que l'écran dédié aux `MoveSuggestion`, tenté puis abandonné)

## [0.3.0] — 2026-07-13 → 2026-07-15 — Calendrier et import

### Added
- Module `CalendarModule` : CRUD calendriers/événements, recherche plein texte
  (`GET /events/search`), enrichissement des événements avec la phase du cycle
- Import Google Calendar (OAuth2 PKCE, clients publics), sync initiale des 90 prochains
  jours, ré-import idempotent — vérifié bout-en-bout sur device Android (dev-client EAS)
- Écran Calendrier principal : grille mensuelle custom, bandes de phase par semaine,
  bandeaux d'événements multi-jours, filtre par calendrier, création d'événement (FAB)
- Écran Détail d'un événement (bottom sheet) : indicateur de phase, actions de
  déplacement, désinscription/suppression/modification
- Écran Recherche (bottom sheet, debounce 300ms)

### Fixed
- Affichage d'un horaire erroné ("02:00 - 02:00") sur les événements journée entière
  (dérive de fuseau horaire, `startAt`/`endAt` ancrés à minuit UTC) — formatage forcé en
  UTC, mention "Toute la journée"
- Événements multi-jours importés n'apparaissant que sur leur premier jour — rendu en
  bandeau continu par-dessus les jours concernés
- Panneau de filtre "Calendriers" recouvert par la barre du bas (`zIndex` manquant)

## [0.2.0] — 2026-07-08 → 2026-07-13 — Onboarding, authentification, saisie du cycle

### Added
- Setup Expo (SDK 57, TypeScript), navigation à 3 niveaux (`AuthNavigator` /
  `OnboardingSetupNavigator` / `AppNavigator`) selon l'état d'authentification et
  d'onboarding
- Écrans Onboarding (3 slides), Welcome, Connexion, Inscription, Vérification OTP (6
  cases, soumission automatique)
- Écran Saisie du cycle, Autorisation calendrier, Import de calendriers (état local),
  Confirmation finale
- `AuthStore` et `CycleStore` (Zustand), client Axios avec intercepteur JWT (refresh
  automatique sur 401)

### Fixed
- Champ email verrouillé sur l'écran Connexion bloquant la saisie quand aucun email
  n'était pré-rempli depuis Welcome

## [0.1.0] — 2026-07-08 — Backend : authentification, base de données, cycle

### Added
- Setup NestJS, Prisma v6 / PostgreSQL, schéma complet (`User`, `CycleEntry`,
  `CyclePhase`, `Calendar`, `Event`, `MoveSuggestion`, `Invitation`, `RefreshToken`,
  `OtpCode`)
- Module `AuthModule` : inscription, connexion, OTP par email (6 chiffres, expiration 10
  min, usage unique haché), JWT (access 15 min + refresh 30 j), rate limiting (5 req / 15
  min)
- Module `UserModule` : profil courant, mise à jour
- Module `CycleModule` : saisie et historique de cycle, calcul des phases
  (`CycleAlgorithmService`, logique pure sans dépendance BDD), prédiction du prochain
  cycle
