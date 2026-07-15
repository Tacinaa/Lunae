# TODO — Lunae MVP

> Jalons : v0.1 (J+3) → v0.2 (J+5) → v0.3 (J+7) → v0.4 (J+9) → v1.0 (J+14)

---

## v0.1 — Backend : Auth + BDD + Cycle (J+3)

### Setup backend
- [x] `cd apps/backend && npx @nestjs/cli new . --package-manager npm`
- [x] Installer les dépendances : `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `prisma`, `@prisma/client`, `nodemailer`
- [x] Configurer `.env` : `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`
- [x] Activer `ValidationPipe` globale dans `main.ts`
- [x] Configurer `ConfigModule` global

### Base de données (Prisma)
- [x] `npx prisma init`
- [x] Écrire le schéma Prisma complet (`schema.prisma`) avec les entités : `User`, `CycleEntry`, `CyclePhase`, `Calendar`, `Event`, `MoveSuggestion`, `Invitation`, `RefreshToken`, `OtpCode`
- [x] `npx prisma migrate dev --name init`
- [x] Créer `PrismaService` injectable

### Module Auth
- [x] Générer `AuthModule`, `AuthService`, `AuthController`
- [x] `POST /auth/register` — créer un utilisateur + hasher le password (bcrypt 12) + générer OTP + envoyer email
- [x] `POST /auth/verify-otp` — vérifier code 6 chiffres (haché, expiration 10 min, usage unique) → émettre access + refresh tokens
- [x] `POST /auth/login` — vérifier email/password → générer OTP si MFA, sinon émettre tokens
- [x] `POST /auth/refresh` — valider refresh token → émettre nouveau access token
- [x] `POST /auth/logout` — révoquer refresh token en BDD
- [x] `POST /auth/request-otp` — renvoi d'un OTP
- [x] Implémenter `JwtAuthGuard` (passport-jwt) appliqué globalement sauf `AuthModule`
- [x] Rate limiting sur les endpoints auth (throttler NestJS : 5 req / 15 min)
- [x] **Tests unitaires Auth** :
  - [x] `hashPassword()` retourne un hash différent du mdp en clair
  - [x] `validatePassword()` — bon mdp → true, mauvais mdp → false
  - [x] `generateOtp()` → chaîne de 6 chiffres
  - [x] `isOtpExpired()` — OTP de 15 min → true, OTP de 5 min → false

### Module User
- [x] Générer `UserModule`, `UserService`, `UserController`
- [x] `GET /users/me` — retourner le profil courant (sans passwordHash)
- [x] `PATCH /users/me` — mettre à jour firstName, lastName, phoneNumber

### Module Cycle
- [x] Générer `CycleModule`, `CycleService`, `CycleController`
- [x] `POST /cycle` — enregistrer un nouveau `CycleEntry` + recalculer les `CyclePhase`
- [x] `GET /cycle` — historique des cycles de l'utilisatrice
- [x] `GET /cycle/current-phase` — phase en cours + numéro de jour du cycle
- [x] `GET /cycle/phases?from=&to=` — phases prédites sur une période (pour alimenter le calendrier)
- [x] `GET /cycle/prediction` — date prédite du prochain cycle (moyenne des N derniers cycles)
- [x] Implémenter `CycleAlgorithmService` (logique pure, sans BDD) :
  - [x] `calculatePhases(startDate, cycleLength, periodDuration)` → tableau `{ date, phase }`
  - [x] `predictNextPeriod(cycleHistory)` → date (moyenne des durées)
  - [x] `getPhaseForDate(date, cycleEntries)` → phase ou null
- [x] **Tests unitaires Cycle** :
  - [x] `calculatePhases()` — cycle 28j, règles 5j → 4 phases correctes (5 + 8 + 3 + 12 jours)
  - [x] `calculatePhases()` — cycle court 21j → phases ajustées
  - [x] `calculatePhases()` — cycle long 35j → phases ajustées
  - [x] `predictNextPeriod()` — 1 cycle → utilise la valeur saisie
  - [x] `predictNextPeriod()` — 3 cycles → utilise la moyenne
  - [x] `getPhaseForDate()` — date en menstruation → `'menstruation'`
  - [x] `getPhaseForDate()` — date hors cycle → `null`

---

## v0.2 — Frontend : Onboarding + Auth + Saisie cycle (J+5)

### Setup frontend
- [x] `cd apps/frontend && npx create-expo-app . --template blank-typescript` (SDK 57, validé avec l'utilisateur plutôt que le SDK 52 mentionné initialement dans CLAUDE.md)
- [x] Installer : `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`
- [x] Installer : `zustand`, `axios`, `@react-native-async-storage/async-storage`
- [x] Installer : `react-native-gesture-handler`, `react-native-reanimated`
- [x] Configurer `babel.config.js` pour Reanimated (plugin `react-native-worklets/plugin`, requis par Reanimated v4)
- [x] Créer la structure de dossiers :
  ```
  src/
  ├── api/         # client Axios + intercepteurs
  ├── components/  # composants réutilisables
  ├── navigation/  # stacks et navigateurs
  ├── screens/     # un dossier par écran
  ├── store/       # stores Zustand (auth, cycle, calendar)
  ├── hooks/       # hooks custom
  └── utils/       # helpers
  ```
- [x] Créer le client Axios (`src/api/client.ts`) avec intercepteur pour injecter le JWT et gérer le refresh automatique (retry sur 401)
- [x] Créer `AuthStore` Zustand : `accessToken`, `user`, `setTokens()`, `logout()` (persisté en AsyncStorage)
- [x] Créer `CycleStore` Zustand : `cycleData`, `phases`, `currentPhase`
- [x] Installer les dépendances de test : `jest-expo`, `@testing-library/react-native`
- [x] Configurer Jest (preset `jest-expo`) + script `test` dans `package.json`

### Navigation
- [x] Créer `RootNavigator` : bascule à 3 niveaux selon l'état d'auth — `AuthNavigator` (non connecté) → `OnboardingSetupNavigator` (connecté mais setup pas terminé) → `AppNavigator` (connecté + setup terminé). Un flag persisté `hasCompletedOnboarding` (AuthStore) pilote la 2ᵉ transition, pour ne pas sauter la saisie du cycle après une inscription.
- [x] `AuthNavigator` : `Onboarding` → `Welcome` → `Login` / `Register` → `OtpVerification`
- [x] `OnboardingSetupNavigator` : `CycleSetup` → `CalendarPermission` → `CalendarImport` → `Ready`
- [x] `AppNavigator` : `MainCalendar` (écran principal)

### Écran 01 — Onboarding (3 slides)
- [x] Composant `OnboardingScreen` avec `ScrollView` horizontal (`FlatList`/`PagerView` écartés : `pagingEnabled`/`scrollToIndex` peu fiables sur `react-native-web`)
- [x] 3 slides avec émoji, titre, texte, bouton CTA
- [x] Indicateur de progression (3 points), mis à jour uniquement via `onScroll` (évite un aller-retour visuel entre bouton et glissé)
- [x] Bouton "Suivant" / "C'est parti !" sur le dernier slide → navigue vers `Welcome`
- [x] Persister en AsyncStorage que l'onboarding a été vu (pour ne pas le reshow)

### Écran 02 — Welcome / Auth
- [x] Logo Lunae (placeholder texte/émoji, pas d'asset graphique)
- [x] Bouton "Continuer avec Apple" (placeholder pour le MVP)
- [x] Bouton "Continuer avec Google" (placeholder pour le MVP)
- [x] Champ email + bouton "Continuer avec un email" → `Register` (email pré-rempli)
- [x] ~~Appel `GET /auth/check-email`~~ — endpoint inexistant côté backend ; remplacé par un lien "Vous avez déjà un compte ? Se connecter" → `Login` (décision validée avec l'utilisateur)

### Écran 03 — Connexion
- [x] Champ email éditable (pré-rempli si dispo depuis Welcome) — **pas désactivé** : le champ verrouillé bloquait la saisie quand on arrivait sur Login sans email pré-rempli (bug constaté en test)
- [x] Champ mot de passe
- [x] Bouton "Continuer" → `POST /auth/login` → navigue vers OTP

### Écran 04 — Inscription
- [x] Champs : prénom, nom, email, mot de passe
- [x] Bouton "Continuer" → `POST /auth/register` → navigue vers OTP

### Écran — Vérification OTP
- [x] 6 cases de saisie individuelles (auto-focus suivant/arrière), soumission automatique dès les 6 chiffres saisis
- [x] `POST /auth/verify-otp` → `setTokens()`
- [x] Lien "Renvoyer le code" → `POST /auth/request-otp`
- [x] Afficher l'email masqué dans le texte

### Écran 07 — Saisie du cycle
- [x] Date picker : "Date de début de vos dernières règles" (`@react-native-community/datetimepicker` — natif iOS/Android, l'app est mobile-only donc pas de fallback web ; `onChange` déprécié → migré vers `onValueChange`/`onDismiss`, warning constaté en test sur Expo Go)
- [x] Stepper : "Durée du cycle" (21–35, défaut 28)
- [x] Stepper : "Durée des règles" (2–8, défaut 5)
- [x] Bouton "Continuer" → `POST /cycle` → navigue vers `CalendarPermission`

### Écran 08 — Autorisation calendrier
- [x] Texte explicatif
- [x] Bouton "Autoriser l'accès" → demande permission native Expo (`expo-calendar` — nouvelle API objet non fonctionnelle sur Expo Go, import requis depuis `expo-calendar/legacy`)
- [x] → navigue vers `CalendarImport` (accordé ou refusé — l'import reste possible/optionnel à l'étape suivante)

### Écran 09 — Import de calendriers
- [x] Liste : Apple (+), Google (+), Microsoft (+)
- [x] Section "Comptes importés" avec bouton × (état local uniquement — pas d'appel API : `POST /calendars/import/*` pas encore implémenté côté backend, prévu v0.3 ; comportement identique aux boutons SSO placeholder du Welcome)
- [x] Bouton "Suivant" → navigue vers `Ready`

### Écran 10 — Confirmation finale
- [x] Logo + "Tout est prêt !" + bouton "Commencer" → `completeOnboarding()` débloque `AppNavigator`/`MainCalendar`

### Tests unitaires (frontend)
- [x] `AuthStore` — `setTokens()` met à jour `accessToken`/`user` ; `logout()` réinitialise l'état
- [x] `CycleStore` — mise à jour de `cycleData`/`phases`/`currentPhase`
- [x] Client Axios — intercepteur : requête en 401 déclenche un refresh puis rejoue la requête d'origine ; refresh échoué → `logout()`
- [x] Helper de persistance "onboarding vu" (AsyncStorage) — écrit puis relit correctement le flag

---

## v0.3 — Calendrier + Import (J+7)

### Backend — Module Calendar
- [x] Générer `CalendarModule`, `CalendarService`, `CalendarController`
- [x] `GET /calendars` — liste des calendriers de l'utilisatrice
- [x] `POST /calendars` — créer un calendrier local
- [x] `DELETE /calendars/:id` — supprimer un calendrier
- [x] `GET /events?from=&to=` — événements sur une période, enrichis avec la phase du cycle
- [x] `GET /events/:id` — détail d'un événement
- [x] `POST /events` — créer un événement
- [x] `PATCH /events/:id` — modifier un événement
- [x] `DELETE /events/:id` — supprimer un événement
- [x] `GET /events/search?q=` — recherche plein texte (ILIKE sur title)
- [x] `POST /calendars/import/google` — OAuth2 PKCE (Android/iOS, clients publics, pas de client
  secret) + `googleapis`/`google-auth-library` réexporté via `google.auth.OAuth2` (évite un conflit
  de types entre les copies internes de `google-auth-library` embarquées par `googleapis`). Échange
  le code d'autorisation, upsert `Calendar` (`source: google`, tokens chiffrés AES-256-GCM avec une
  clé dédiée `GOOGLE_TOKEN_ENCRYPTION_KEY`, séparée de celle des notes de cycle — extraction d'un
  utilitaire crypto commun `common/crypto.util.ts` réutilisé par les deux), puis sync initiale des
  90 prochains jours du calendrier principal via `prisma.event.createMany` (contourne
  `EventService.create()` pour ne pas déclencher une suggestion par événement importé).
  `isMovable: false` sur tous les événements importés (pas d'écriture vers Google en MVP). Mapping
  Google → `Event` extrait en fonction pure testée (`google-calendar-event-mapper.ts`, 14 tests).
  Implémentation posée le 2026-07-15, vérifiée manuellement bout-en-bout le jour même (cf. CR-09) :
  build dev-client via EAS Build cloud (pas de SDK Android local sur la machine de développement),
  consentement Google réel, calendrier et événements importés visibles dans l'app, ré-import
  idempotent (pas de doublon). Deux ajustements faits en cours de route : le client OAuth Android
  refuse par défaut les redirections vers un schéma d'URI personnalisé ("custom URI scheme is not
  enabled") — activé explicitement dans les paramètres avancés du client Android (propagation
  Google ~5-15 min) plutôt que de basculer vers un client "Web application" ; et le schéma
  `com.lunae.app` (celui utilisé par défaut par `expo-auth-session` pour la redirection) ajouté à
  `app.json` — seul `lunae` y était déclaré, donc aucun intent-filter Android ne correspondait à la
  redirection OAuth, qui retombait sur la page d'accueil Google au lieu de revenir dans l'app.
- [x] `POST /calendars/import/apple` — CalDAV Apple → stocker credentials + sync initiale —
  confirmé en scope Bloc 2 le 2026-07-15 (contrairement à Microsoft, cf. Backlog). Implémentation :
  `AppleCalendarService` (`createDAVClient` de `tsdav`, auth Basic avec identifiant Apple + mot de
  passe d'application), upsert `Calendar` par calendrier iCloud détecté (`source: apple`), sync des
  90 prochains jours (`fetchCalendarObjects` + parsing ICS via `node-ical`), mapping événement ICS →
  `Event` extrait en fonction pure testée (`apple-calendar-event-mapper.ts`). Formulaire dédié dans
  `CalendarImportScreen` (identifiant + mot de passe d'application, avec aide contextuelle) et hook
  `useAppleCalendarImport`. Contrairement à l'import Google (OAuth, cf. CR-09), CalDAV n'a pas de
  contrainte de redirection propre à l'app — mais **non vérifié bout-en-bout sur device** : Expo Go
  pour le SDK 57 (celui du projet) n'est pas encore disponible sur l'App Store iOS au 2026-07-15
  (mise à jour en attente de review Apple, confirmé via le changelog Expo ;  déjà dispo côté
  Android/Play Store). `eas go` (build TestFlight) débloquerait le test mais nécessite un compte
  Apple Developer payant — décision du 2026-07-15 de ne pas payer pour cette certification, cf.
  Backlog. Test manuel reporté au Bloc 3/4.

### Frontend — Écran 11 — Calendrier principal
- [x] Grille mensuelle custom (ou `react-native-calendars`) — implémentation custom (`utils/calendarGrid.ts`), pas de dépendance ajoutée
- [x] Navigation mois précédent / suivant
- [x] Aujourd'hui cerclé en violet
- [x] Bandes de couleur horizontales par semaine selon la phase (`GET /cycle/phases?from=&to=`) — trait fin en bas de chaque cellule, coloré par phase (jours consécutifs de même phase → bande continue) ; le fond de cellule teinté envisagé initialement a été abandonné (confusion avec la couleur du calendrier des événements). Repositionné le 2026-07-15 dans sa propre rangée juste sous les numéros de jour (au lieu de suivre les pastilles d'événement) : sa position variait selon qu'un jour avait 0, 1 ou 2 événements, cassant l'alignement horizontal de la bande d'une semaine à l'autre — constaté sur device en testant l'import Google.
- [x] Événements sous les jours (tronqués à ~12 chars) — les événements journée entière multi-jours (import Google notamment) n'apparaissaient que sur leur premier jour ; ajout d'un rendu en bandeau continu (`layoutWeekBanners()`, `utils/calendarGrid.ts`) enjambant les cellules concernées, titre affiché une seule fois, avec empilement en plusieurs lignes si des événements se chevauchent. Première itération basée sur une rangée de bandeaux partagée pour toute la semaine : les jours non couverts par un bandeau étaient quand même poussés en dessous de tous les bandeaux de la semaine (espace vide inutile). Corrigé le 2026-07-15 : chaque jour empile désormais indépendamment ses propres segments de bandeau (partie gauche/droite arrondie selon la position dans le bandeau, marge horizontale négative pour rester visuellement continu d'une colonne à l'autre) puis ses pastilles — un jour sans bandeau remonte directement sous la ligne de phase
- [x] Icônes barre sup : 🔍 Recherche, 📥 Invitations, ⚙️ Paramètres — 🔍 câblée (ouvre l'Écran 15) ; 📥 et ⚙️ affichées mais non câblées (Écran 14 Invitations en v0.4, pas d'écran Paramètres prévu au TODO)
- [x] Bouton "Aujourd'hui" (bas)
- [x] Bouton "Calendriers" (filtre) (bas) — panneau local avec cases à cocher par calendrier (`GET /calendars`). Corrigé le 2026-07-15 : le panneau était rendu avant la barre du bas dans le JSX (sans `zIndex`), donc visuellement recouvert par elle et difficile à cliquer — réordonné + `zIndex`/`elevation` + fond semi-transparent pour fermer au tap extérieur. Un bouton "+ Importer un calendrier Google" a été ajouté dans ce même panneau (réutilise `useGoogleCalendarImport`), l'import n'étant sinon déclenchable qu'une fois, pendant l'onboarding
- [x] FAB "+" → créer un événement — modal dédiée (`CreateEventModal`), pas de bottom sheet (réservé à l'Écran 12). Formulaire retravaillé le 2026-07-15 (retour utilisatrice : trop de blocs bordés empilés) en deux cartes groupées "Quand"/"Détails" avec séparateurs internes ; ajout du support des événements "Toute la journée" (absent jusque-là : aucun champ ne permettait d'en créer), y compris sur plusieurs jours via un sélecteur "Jusqu'au" ; padding de zone de sécurité ajouté en bas (boutons Annuler/Créer se superposaient à la barre de navigation Android)

### Frontend — Écran 12 — Détail d'un événement (bottom sheet)
- [x] Bottom sheet avec `@gorhom/bottom-sheet`
- [x] Titre, date, horaire, lieu, calendrier (couleur), notes — les événements journée entière (imports Google notamment) affichaient un horaire absurde ("02:00 - 02:00") : `startAt`/`endAt` sont ancrés à minuit UTC pour ces événements, et le formatage en heure locale (France, UTC+2 l'été) faisait dériver l'affichage. Corrigé le 2026-07-15 : plage horaire remplacée par "Toute la journée" (et plage de dates au lieu d'une date unique si l'événement couvre plusieurs jours), formatage forcé en UTC via `Intl`
- [x] Indicateur de phase : "Non concerné" OU `[phase] — [recommandation]` — texte aligné sur la maquette Figma ("Incompatible avec la phase du cycle" / "Non concerné avec la phase du cycle") plutôt que le gabarit `[phase] — [recommandation]`
- [x] Bouton "Voir les suggestions" si phase défavorable + événement déplaçable — remplacé par un bandeau de recommandation affiché directement (pas de bouton intermédiaire), avec "Garder cette date" / "Choisir un créneau" → ouvre un mini-calendrier (jours favorables en surbrillance, événements déjà prévus visibles, jours passés exclus) ; couvre le besoin de l'Écran 13 (v0.4) en version simplifiée côté client, sans passer par `MoveSuggestion`/`RecommendationModule`. Un rebranchement sur ces endpoints (écran dédié listant les vraies `MoveSuggestion`) a été tenté le 2026-07-14 puis abandonné : l'UX obtenue était nettement moins bonne que ce mini-calendrier — ne pas retenter sans en rediscuter.
- [x] Bouton "Se désinscrire" pour événements importés — + Supprimer/Modifier pour les événements locaux (hors périmètre TODO initial mais nécessaire pour un CRUD complet ; réutilise `CreateEventModal` en mode édition)

### Frontend — Écran 15 — Recherche (bottom sheet)
- [x] Champ de recherche avec debounce (300ms) — `hooks/useDebouncedValue.ts`, bottom sheet dédié (`SearchSheet`), ouvert depuis l'icône 🔍 de l'Écran 11
- [x] Appel `GET /events/search?q=`
- [x] Résultats groupés par date — tap sur un résultat → ouvre la fiche détail (Écran 12)

### Tests unitaires (frontend)
- [x] Mapping phase → couleur (bandes du calendrier) — chaque `Phase` retourne la bonne couleur
- [x] Hook de debounce de la recherche — n'appelle l'API qu'après le délai, annule l'appel précédent si nouvelle frappe

---

## v0.4 — Suggestions + Invitations + Tests (J+9)

### Backend — Module Recommendation
> Le scoring n'est pas une table unique "phase → score" appliquée à tous les événements : chaque
> `EventType` a sa propre table de score par phase (`recommendation-algorithm.service.ts`), basée
> sur des repères généraux (non cliniques) — ex. `sport_intense` optimal en ovulation,
> `focus_administratif` optimal en lutéale. Les catégories neutres (`meeting`/`class`/`personal`/
> `other`) retombent sur la table générique du CLAUDE.md. `EventType` a été étendu en conséquence
> (remplace `sport` par `sport_intense`/`sport_leger`, ajoute `focus_administratif`/
> `creation_planification`/`social_enjeu`) — migration `event_type_categories`. Un picker de
> catégorie (chips) a été ajouté à `CreateEventModal` (hors périmètre initial de l'Écran 11/12,
> nécessaire pour que la catégorisation ait un effet). Personnalisation par symptômes déclarés :
> volontairement hors scope MVP (cf. Backlog), le signal accept/dismiss n'étant pas fiable comme
> proxy (un refus peut être logistique, pas une mauvaise recommandation).
- [x] Générer `RecommendationModule`, `RecommendationService`, `RecommendationController`
- [x] `GET /suggestions` — suggestions en attente (status: 'pending')
- [x] `POST /suggestions/:id/accept` — appliquer le déplacement (`PATCH /events/:id` interne)
- [x] `POST /suggestions/:id/dismiss` — ignorer la suggestion
- [x] Implémenter la logique de génération des suggestions :
  - [x] `shouldSuggestMove(event, phase)` → boolean — compare le score de la catégorie à la phase actuelle au score max de cette catégorie (pas une liste de phases universelle)
  - [x] `generateSuggestions(event, phaseCalendar, existingEvents)` → créneaux triés par score décroissant
  - [x] Déclencher la génération au moment de la création/modification d'un événement (`EventService.create`/`update`, synchrone)
- [x] **Tests unitaires Recommendations** (`recommendation-algorithm.service.spec.ts`, 14 tests) :
  - [x] `shouldSuggestMove()` — événement en menstruation + isMovable=true → true
  - [x] `shouldSuggestMove()` — isMovable=false → false
  - [x] `shouldSuggestMove()` — événement en ovulation déjà optimal pour sa catégorie → false
  - [x] `shouldSuggestMove()` — catégorie dont l'optimum n'est pas l'ovulation (ex. `focus_administratif`) → true même en ovulation
  - [x] `generateSuggestions()` — créneaux triés par score décroissant
  - [x] `generateSuggestions()` — exclut les créneaux déjà occupés, les jours passés et le jour d'origine

### Backend — Module Invitation
- [x] Générer `InvitationModule`, `InvitationService`, `InvitationController`
- [x] `GET /invitations` — invitations reçues + répondues (liste brute triée par date ; le regroupement par onglet "Reçues"/"Répondues" se fait côté client selon `status`, comme pour les résultats de recherche groupés par date)
- [x] `PATCH /invitations/:id` — répondre (accepted / declined / maybe)

### Frontend — Écran 14 — Invitations (bottom sheet)
- [x] Onglets "Reçues" / "Répondues"
- [x] Pour chaque invitation : titre, date, horaire, boutons Peut-être / Refuser / Accepter
- [x] Appel `PATCH /invitations/:id` au tap

---

## v1.0 — MVP complet : CI/CD + Déploiement + QA (J+14)

> **Repère certification (2026-07-15)** : ce TODO ne suit que le scope du Bloc 2 (dossier écrit). Le
> Bloc 2 exige de documenter le protocole de déploiement et le pipeline CI/CD, pas d'avoir une
> instance backend ou un binaire mobile actifs en permanence — les tâches d'activation réelle
> (compte Railway + `railway up`, `eas build --profile preview/production`) sont donc entièrement
> sorties de ce fichier et déplacées dans le Backlog en bas de document (scope Bloc 3).

### Infrastructure
- [x] Créer `Dockerfile` pour le backend NestJS (multi-stage build) — `node:22-slim` (pas Alpine :
  `bcrypt` a des bindings natifs qui utilisent les binaires prébuilts glibc, évite un build gcc/python
  sur musl), `openssl` installé explicitement dans les deux stages (Prisma ne détecte pas la libssl
  sinon, warning au `prisma generate`). Bug latent découvert et corrigé au passage : `nest build`
  sort dans `dist/src/main.js` (à cause de `sourceRoot: "src"` dans `nest-cli.json`), pas
  `dist/main.js` — le script `start:prod` du `package.json` pointait au mauvais endroit depuis le
  début (jamais exécuté avant ce test). Image buildée et testée en conditions réelles : conteneur
  démarré, connecté à la Postgres locale (`host.docker.internal:5433`), toutes les routes
  enregistrées, `POST /auth/login` atteint bien la vérification bcrypt puis échoue *volontairement*
  (SMTP non configuré + `NODE_ENV=production` → `MailService` refuse le fallback console, comportement
  voulu, pas un bug).
- [x] Créer `docker-compose.yml` pour développement local (PostgreSQL ; backend pas encore containerisé)
- [x] Préparer la configuration de déploiement Railway (`railway.json`, manuel dans
  `DEPLOIEMENT.md`) — l'activation réelle (compte Railway, variables, `railway up`) est hors scope
  Bloc 2, cf. Backlog

### CI/CD (GitHub Actions)
- [x] Créer `.github/workflows/ci.yml` (mis en place dès v0.1 plutôt qu'à la fin, pour attraper les régressions au fil de l'eau) :
  - [x] Déclenché sur `push` vers `master` et `pull_request`
  - [x] Job `backend` : checkout → `npm ci` → ESLint → Jest (couverture) → Build TS
  - [x] Job `frontend` : checkout → `npm ci` → ESLint (`expo lint`, scaffoldé — le projet n'avait
    aucune config ESLint jusqu'ici) → Jest (`jest-expo`, couverture) → Typecheck. Corrections
    nécessaires pour un lint propre : apostrophes JSX non échappées (`react/no-unescaped-entities`,
    remplacées par `’`), variable `code` inutilisée dans `OtpVerificationScreen`. Deux règles
    désactivées explicitement (voir commentaires dans `eslint.config.js`) : `react-hooks/set-state-in-effect`
    (faux positif sur le pattern standard `setIsLoading(true)` en tête d'effet de fetch, utilisé
    partout dans l'app) et `import/no-named-as-default-member` (faux positif connu avec l'export
    CJS/ESM d'axios sur `axios.create()`/`axios.isAxiosError()`, déjà l'usage documenté correct).
  - [x] Job `deploy` (dépend de `backend`) : posé le 2026-07-15, déclenché sur push `master`
    uniquement, applique les migrations Prisma puis déploie via `railway run`/`railway up`
    (`@railway/cli`, pas de push registry séparé — Railway build directement l'image depuis le repo).
    Volontairement gardé inactif (étapes réelles sautées, log explicite, pas d'échec CI) tant que le
    secret `RAILWAY_TOKEN` n'est pas configuré — cf. `DEPLOIEMENT.md` pour le protocole d'activation

### Qualité et tests
- [x] Supprimer le boilerplate e2e généré par défaut par `nest new` (`test/app.e2e-spec.ts`, `test/jest-e2e.json`, script `test:e2e`, dépendance `supertest`) — aucun test e2e n'est prévu sur ce projet
- [x] Configurer Jest avec rapport de couverture (seuil minimum 80% sur les modules core), backend
  et frontend — seuils appliqués via `coverageThreshold` (glob par fichier) uniquement sur les
  modules de logique pure, pas sur l'ensemble du code (les controllers/services qui touchent
  Prisma/JWT ne sont pas unit-testés par choix, cf. pas d'e2e). Backend : `auth-algorithm.service.ts`,
  `cycle-algorithm.service.ts`, `recommendation-algorithm.service.ts` — Auth a été refactoré à
  cette occasion pour extraire ses 4 fonctions pures (`hashPassword`, `validatePassword`,
  `generateOtp`, `isOtpExpired`), jusque-là dupliquées à la fois comme méthodes de `AuthService`
  (jamais appelées) et inline dans `register()`/`login()`/`verifyOtp()`/`sendOtp()` — même pattern
  que `CycleAlgorithmService`/`RecommendationAlgorithmService`, `auth.service.spec.ts` remplacé par
  `auth-algorithm.service.spec.ts`. Frontend : `calendarGrid.ts`, `phaseRecommendation.ts`,
  `theme.ts`, `onboarding.ts` (test manquant sur `resetOnboardingSeen()` ajouté au passage),
  `authStore.ts`, `cycleStore.ts`, `useDebouncedValue.ts`. Seuils vérifiés fonctionnels (testé
  qu'un seuil intentionnellement cassé fait échouer `test:cov`, pas juste silencieusement ignoré).
- [x] Passer tous les tests unitaires définis en v0.1, v0.2, v0.3 et v0.4 au vert (aucun test e2e
  prévu — hors scope du projet) — 58 tests backend, 57 tests frontend, tous verts
- [ ] Cahier de recette — vérifier manuellement CR-01 à CR-13. CR-01/02/03/04/05/07/08/10/11/12
  vérifiés par appels API réels (curl) sur une instance backend isolée (port 3002, même BDD),
  compte de test créé puis supprimé via `DELETE /users/me` en fin de vérification (double usage :
  nettoyage + revalidation de l'endpoint via un vrai appel HTTP). CR-06 et CR-09 confirmés par
  l'utilisatrice sur device (build dev-client EAS) ; CR-13 partiellement fait (TalkBack validé,
  VoiceOver en attente d'un test sur iPhone) :
  - [x] CR-01 : Inscription email valide → OTP reçu — 201, OTP `236583` généré et loggé
  - [x] CR-02 : Email déjà utilisé → erreur claire — 409 "Email déjà utilisé"
  - [x] CR-03 : OTP correct → accès accordé — 200, access + refresh token émis
  - [x] CR-04 : OTP expiré → message d'erreur — OTP forcé expiré en base, 401 "Code expiré"
  - [x] CR-05 : Saisie cycle → phase correcte dans le calendrier — cycle créé (28j/5j, début
    aujourd'hui), `GET /cycle/current-phase` → menstruation, jour 1, conforme
  - [x] CR-06 : Vue mensuelle → 4 bandes de couleur visibles — confirmé par l'utilisateur sur device (visible aussi sur la capture d'écran du 2026-07-15, avec les segments par phase)
  - [x] CR-07 : Événement en menstruation déplaçable → suggestion proposée — événement
    `sport_intense` créé en menstruation, suggestions générées automatiquement (meilleures en
    ovulation, score 3)
  - [x] CR-08 : Accepter une suggestion → événement déplacé — `POST /suggestions/:id/accept` →
    suggestion "accepted", `startAt`/`endAt` de l'événement mis à jour à la date suggérée
  - [x] CR-09 : Import Google Calendar → événements visibles — vérifié le 2026-07-15 sur un
    dev-client buildé via EAS Build cloud (Android), consentement Google réel, calendrier +
    événements du compte de test importés et visibles dans l'app, ré-import sans doublon
    (cf. v0.3 pour le détail des deux ajustements OAuth nécessaires en cours de route). iOS non
    testé et hors scope de cette certification (cf. Backlog) : le test nécessiterait un dev-client
    EAS (comme pour Android), impossible via Expo Go seul (le flux OAuth redirige vers
    `com.lunae.app:/oauthredirect`, un schéma propre à l'app, qu'Expo Go — qui tourne sous sa
    propre identité `host.exp.Exponent` — ne peut pas intercepter), et un dev-client EAS iOS
    suppose un compte Apple Developer payant (99$/an), non prévu pour cette certification
  - [x] CR-10 : Recherche "Boxe" → résultats filtrés — `GET /events/search?q=Boxe` → 1 résultat,
    insensible à la casse
  - [x] CR-11 : Accepter invitation → statut "Accepté" — `PATCH /invitations/:id` →
    `status: "accepted"`
  - [x] CR-12 : Token expiré → 401 + refresh automatique — token invalide → 401 ;
    `POST /auth/refresh` avec refresh token valide → nouveau access token. Partie "automatique"
    (interception 401 côté client) déjà testée unitairement (`client.spec.ts`)
  - CR-13 : Navigation complète avec VoiceOver (iOS) et TalkBack (Android) → tous les éléments
    interactifs annoncés correctement (cf. Accessibilité) :
    - [x] TalkBack (Android) — validé par l'utilisateur sur device : les `accessibilityLabel`
      sont annoncés comme prévu (grille du calendrier avec la phase, onglets d'`InvitationsSheet`)
    - [ ] VoiceOver (iOS) — iPhone disponible le 2026-07-15 comme prévu, mais test bloqué : Expo Go
      pour le SDK 57 du projet n'est pas encore sur l'App Store iOS (review Apple en attente,
      contrairement à l'import Google qui lui était bloqué par un module natif custom, cf. CR-09).
      `eas go`/TestFlight écarté (compte Apple Developer payant, hors scope certification). Reporté
      au Bloc 3/4, cf. Backlog

### Accessibilité (WCAG AA)
- [x] Vérifier ratio de contraste violet #6B3FA0 sur fond blanc (≥ 4.5:1) — 7.38:1, conforme (calcul luminance relative WCAG). Au passage, couleurs de phase vérifiées aussi (`utils/theme.ts`) : traits de phase 4.10–12.99:1 vs blanc (seuil 3:1 non-textuel), contour du jour suggéré 4.10:1
- [x] Ajouter `accessibilityLabel` sur tous les boutons et éléments interactifs — audit fait sur
  tous les écrans/composants (comparaison nombre de `<Pressable>` vs `accessibilityLabel` par
  fichier) ; seul manque trouvé : les deux onglets Reçues/Répondues d'`InvitationsSheet`, corrigé
- [x] Vérifier tailles de zones tactiles ≥ 44×44 dp — 9 zones sous le seuil trouvées et corrigées
  (36–40dp → 44dp) : chips de catégorie (`CreateEventModal`), flèches de navigation du
  mini-calendrier (`EventDatePicker`), boutons "Garder cette date"/"Choisir un créneau"
  (`EventDetailSheet`), onglets + boutons Peut-être/Refuser/Accepter (`InvitationsSheet`),
  bouton de reset dev (`MainCalendarScreen`)
- Tester avec VoiceOver (iOS) et TalkBack (Android) — reporté au cahier de recette (cf. CR-13) :
  - [x] TalkBack (Android) — validé par l'utilisateur
  - [ ] VoiceOver (iOS) — bloqué par l'absence de SDK 57 sur Expo Go iOS (App Store), reporté au
    Bloc 3/4, cf. CR-13 et Backlog
- [x] Chaque phase du cycle a couleur + icône + label texte (pas de dépendance couleur seule) —
  la grille du calendrier principal n'encodait la phase que par la couleur du trait sous chaque
  jour (violation WCAG 1.4.1, palette violet/magenta peu distinguable pour un daltonien) :
  - [x] Label texte pour lecteur d'écran — `accessibilityLabel` du jour enrichi avec le nom de la
    phase ("9 juillet, phase menstruation"), couvre VoiceOver/TalkBack
  - [x] Repère visuel non-couleur par phase sur la grille — le trait de phase (une seule barre
    pleine auparavant) est redécoupé en segments (`phaseSegmentsRow`/`phaseSegment` dans
    `MainCalendarScreen.tsx`, `getPhaseSegmentCount()` dans `utils/theme.ts`), dont le nombre
    correspond à la position de la phase dans le cycle : menstruation = 1 segment plein,
    folliculaire = 2, ovulation = 3, lutéale = 4 — mnémotechnique, ne dépend pas de `borderStyle:
    'dashed'` (rendu incohérent sur Android). Option alternative écartée (épaisseur variable +
    pointillés) : ne distingue que 2 groupes sur 4 et peu fiable sur Android. Testé sur device par
    l'utilisateur : fonctionne, lisible, mais jugé moins esthétique que le trait plein d'origine —
    compromis accepté pour le MVP (fonctionnel avant esthétique sur ce point), à revisiter en post-MVP
    si besoin (cf. Backlog).

### RGPD
- [x] Ajouter `DELETE /users/me` → suppression en cascade de toutes les données (toutes les
  relations du schéma ont `onDelete: Cascade` depuis `User` — une seule suppression suffit ;
  vérifié manuellement : cycles/événements/invitations/suggestions bien effacés)
- [x] Écran de consentement explicite lors de l'onboarding (avant la saisie du cycle) —
  `ConsentScreen`, premier écran d'`OnboardingSetupNavigator` (avant `CycleSetup`) : case à
  cocher décochée par défaut (consentement explicite, pas de pré-cochage), bouton "Continuer"
  désactivé tant qu'elle n'est pas cochée. Pas de persistance backend d'un enregistrement de
  consentement (pas de modèle dédié en base) — hors scope MVP, cf. Backlog si nécessaire pour
  la certification.
- [x] Chiffrement des données de cycle en BDD — `notes` de `CycleEntry` chiffré en AES-256-GCM
  applicatif (`cycle-encryption.util.ts`, clé `CYCLE_DATA_ENCRYPTION_KEY`), seul champ libre
  jamais trié/calculé. `startDate`/`cycleLength`/`periodDuration` restent en clair en base : ils
  sont triés (`orderBy: startDate`) et utilisés dans des calculs arithmétiques
  (`predictNextPeriod`), incompatibles avec un chiffrement au niveau champ sans déchiffrer tout
  l'historique en mémoire à chaque appel. Décision d'architecture délibérée : leur protection au
  repos est déléguée au chiffrement de l'infrastructure (disque du Postgres managé
  Railway/Render, standard sur ce type d'hébergement) plutôt qu'à un chiffrement applicatif qui
  casserait le tri et la prédiction pour un gain de sécurité marginal. À documenter comme tel
  dans le dossier de certification (grille C2.2.3).

### Build Expo
- [x] Configurer `eas.json` pour EAS Build (profiles development, preview, production) — compte
  Expo lié (`eas login` + `eas init`), projet créé : `@tacina/frontend` (projectId dans
  `app.json`/`extra.eas.projectId`). `eas.json` généré via `eas build:configure --platform all`
  (profils standards, pas modifiés à la main pour rester compatible avec la version d'`eas-cli`
  installée). `eas-cli` ajouté en devDependency. Un build `development` a servi à valider l'import
  Google Calendar sur device réel (cf. CR-09). Le lancement d'un build `preview`/`production` est
  hors scope Bloc 2, cf. Backlog.

---

## Backlog post-MVP (hors scope)

- **Activer le déploiement Railway** (scope Bloc 3) — créer le compte, configurer les variables
  d'environnement, `railway up` ; manuel complet déjà rédigé dans `DEPLOIEMENT.md`, config déjà
  posée (`apps/backend/railway.json`, job CI `deploy` prêt mais inactif tant que `RAILWAY_TOKEN`
  n'existe pas)
- **Lancer un build EAS `preview`/`production`** (scope Bloc 3) — `eas build --platform all
  --profile preview`, pour avoir un binaire installable par lien à montrer/faire tester sans
  dépendre d'un PC allumé avec Metro ; `eas.json` déjà configuré
- **Import Microsoft Outlook** (`POST /calendars/import/microsoft`, OAuth2) — remis à plus tard le
  2026-07-15 pour prioriser l'import Apple (CalDAV) ; Google déjà fait (cf. CR-09)
- **Import Google Calendar sur iOS** — code déjà prêt côté backend/frontend (client OAuth iOS
  configuré), jamais testé en conditions réelles. Nécessite un dev-client EAS iOS, donc un compte
  Apple Developer payant (99$/an) — décision du 2026-07-15 de ne pas payer pour cette certification,
  contrairement au déploiement Railway (reporté, pas abandonné). VoiceOver (CR-13) reste testable
  sans ce compte via Expo Go, seul l'import Google est concerné par cette limite
- **Tests manuels sur iPhone** (VoiceOver CR-13, import Apple Calendar CalDAV) — reportés au Bloc
  3/4 le 2026-07-15 : Expo Go pour le SDK 57 du projet n'est pas encore approuvé sur l'App Store iOS
  (build en attente de review Apple, déjà dispo côté Android). `eas go` (build TestFlight custom)
  débloquerait immédiatement mais suppose un compte Apple Developer payant (99$/an), écarté pour la
  même raison que l'import Google sur iOS (cf. ci-dessus). À retester dès que la review Apple aboutit,
  sans coût ni action supplémentaire de notre côté
- **Synchronisation incrémentale Google Calendar** (`POST /calendars/:id/sync`, via `syncToken`) —
  écarté du Bloc 2 le 2026-07-15 : le ré-import actuel refait déjà un pull complet idempotent des
  90 prochains jours (pas de doublon, cf. CR-09), suffisant fonctionnellement pour la démo ; une
  vraie sync incrémentale n'apporterait rien de visible pour la certification
- Abonnement premium / Stripe
- Journalisation des symptômes
- Partage de calendrier avec un partenaire
- Notifications push avancées
- Passkey / 2FA SMS (P2 — optionnel)
- Bouton "Continuer avec Apple / Google" (SSO)
- **Vue Semaine/Jour** (maquette `Figma/Vue jours.png` et `Figma/semaine.png`) — agenda horaire par jour avec sélecteur de jours de la semaine en haut, statuts d'invitation par couleur de bloc (déclinée = gris, en attente = contour blanc, peut-être = beige), icône de récurrence, temps de trajet avant événement
- **Vue Année** (maquette `Figma/Vue année.png`) — grille des 12 mois miniatures, mêmes boutons bas de page (Aujourd'hui / Calendriers) et FAB que la vue mois
- **Import des données de cycle depuis Flo/Clue** (maquette `Figma/Import autres calendriers-1.png`) — écran "Récupérons vos données de cycle", distinct de l'import de calendriers externes
- **Repère visuel de phase plus esthétique** — le repère par segments (nombre = position dans le cycle, cf. Accessibilité) fonctionne et est lisible mais jugé moins joli que le trait plein d'origine ; revoir le design (icône, motif) sans perdre la propriété "pas de dépendance couleur seule"
