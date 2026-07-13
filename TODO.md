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
- [ ] `POST /calendars/import/google` — OAuth2 Google Calendar → stocker token + sync initiale
- [ ] `POST /calendars/import/apple` — CalDAV Apple → stocker credentials + sync initiale
- [ ] `POST /calendars/import/microsoft` — OAuth2 Microsoft → stocker token + sync initiale
- [ ] `POST /calendars/:id/sync` — synchronisation incrémentale (syncToken)

### Frontend — Écran 11 — Calendrier principal
- [x] Grille mensuelle custom (ou `react-native-calendars`) — implémentation custom (`utils/calendarGrid.ts`), pas de dépendance ajoutée
- [x] Navigation mois précédent / suivant
- [x] Aujourd'hui cerclé en violet
- [x] Bandes de couleur horizontales par semaine selon la phase (`GET /cycle/phases?from=&to=`) — trait fin en bas de chaque cellule, coloré par phase (jours consécutifs de même phase → bande continue) ; le fond de cellule teinté envisagé initialement a été abandonné (confusion avec la couleur du calendrier des événements)
- [x] Événements sous les jours (tronqués à ~12 chars)
- [x] Icônes barre sup : 🔍 Recherche, 📥 Invitations, ⚙️ Paramètres — 🔍 câblée (ouvre l'Écran 15) ; 📥 et ⚙️ affichées mais non câblées (Écran 14 Invitations en v0.4, pas d'écran Paramètres prévu au TODO)
- [x] Bouton "Aujourd'hui" (bas)
- [x] Bouton "Calendriers" (filtre) (bas) — panneau local avec cases à cocher par calendrier (`GET /calendars`)
- [x] FAB "+" → créer un événement — modal dédiée (`CreateEventModal`), pas de bottom sheet (réservé à l'Écran 12)

### Frontend — Écran 12 — Détail d'un événement (bottom sheet)
- [x] Bottom sheet avec `@gorhom/bottom-sheet`
- [x] Titre, date, horaire, lieu, calendrier (couleur), notes
- [x] Indicateur de phase : "Non concerné" OU `[phase] — [recommandation]` — texte aligné sur la maquette Figma ("Incompatible avec la phase du cycle" / "Non concerné avec la phase du cycle") plutôt que le gabarit `[phase] — [recommandation]`
- [x] Bouton "Voir les suggestions" si phase défavorable + événement déplaçable — remplacé par un bandeau de recommandation affiché directement (pas de bouton intermédiaire), avec "Garder cette date" / "Choisir un créneau" → ouvre un mini-calendrier (jours favorables en surbrillance, événements déjà prévus visibles, jours passés exclus) ; recouvre une bonne partie de l'Écran 13 (v0.4) en version simplifiée côté client, sans passer par `MoveSuggestion`/`RecommendationModule` — voir note sous Écran 13
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
- [ ] Générer `RecommendationModule`, `RecommendationService`, `RecommendationController`
- [ ] `GET /suggestions` — suggestions en attente (status: 'pending')
- [ ] `POST /suggestions/:id/accept` — appliquer le déplacement (`PATCH /events/:id` interne)
- [ ] `POST /suggestions/:id/dismiss` — ignorer la suggestion
- [ ] Implémenter la logique de génération des suggestions :
  - [ ] `shouldSuggestMove(event, phase)` → boolean
  - [ ] `generateSuggestions(event, phaseCalendar, existingEvents)` → créneaux triés par score
  - [ ] Déclencher la génération au moment de la création/modification d'un événement
- [ ] **Tests unitaires Recommendations** :
  - [ ] `shouldSuggestMove()` — événement en menstruation + isMovable=true → true
  - [ ] `shouldSuggestMove()` — isMovable=false → false
  - [ ] `shouldSuggestMove()` — événement en ovulation → false
  - [ ] `generateSuggestions()` — créneaux triés par score décroissant (ovulation=3, folliculaire=2, lutéale=1)
  - [ ] `generateSuggestions()` — exclut les créneaux déjà occupés

### Backend — Module Invitation
- [ ] Générer `InvitationModule`, `InvitationService`, `InvitationController`
- [ ] `GET /invitations` — invitations reçues + répondues
- [ ] `PATCH /invitations/:id` — répondre (accepted / declined / maybe)

### Frontend — Écran 13 — Suggestion de déplacement
> Une version simplifiée existe déjà côté client (v0.3, Écran 12) : bandeau + mini-calendrier
> avec jours favorables en surbrillance, sans persistance `MoveSuggestion`. Le travail restant
> ici est surtout backend (génération/scoring réel des créneaux, endpoints dédiés) ; l'UI est à
> adapter pour les consommer plutôt qu'à reconstruire entièrement.
- [ ] Modal/bottom sheet depuis le détail événement
- [ ] Description de la phase actuelle et pourquoi elle est défavorable
- [ ] Liste des créneaux alternatifs (date, heure, phase, couleur)
- [ ] Bouton "Choisir ce créneau" → `POST /suggestions/:id/accept`
- [ ] Bouton "Garder la date actuelle" → `POST /suggestions/:id/dismiss`

### Frontend — Écran 14 — Invitations (bottom sheet)
- [ ] Onglets "Reçues" / "Répondues"
- [ ] Pour chaque invitation : titre, date, horaire, boutons Peut-être / Refuser / Accepter
- [ ] Appel `PATCH /invitations/:id` au tap

---

## v1.0 — MVP complet : CI/CD + Déploiement + QA (J+14)

### Infrastructure
- [ ] Créer `Dockerfile` pour le backend NestJS (multi-stage build)
- [x] Créer `docker-compose.yml` pour développement local (PostgreSQL ; backend pas encore containerisé)
- [ ] Configurer les variables d'environnement Railway/Render (secrets)
- [ ] Déployer le backend sur Railway ou Render

### CI/CD (GitHub Actions)
- [x] Créer `.github/workflows/ci.yml` (mis en place dès v0.1 plutôt qu'à la fin, pour attraper les régressions au fil de l'eau) :
  - [x] Déclenché sur `push` vers `master` et `pull_request`
  - [x] Job `backend` : checkout → `npm ci` → ESLint → Jest (couverture) → Build TS
  - [ ] Job `frontend` : checkout → `npm ci` → ESLint → Jest (`jest-expo`, couverture) — à ajouter une fois le projet Expo initialisé (v0.2)
  - [ ] Job `deploy` (dépend de `test`) : build image Docker → push registry → déploiement Railway

### Qualité et tests
- [x] Supprimer le boilerplate e2e généré par défaut par `nest new` (`test/app.e2e-spec.ts`, `test/jest-e2e.json`, script `test:e2e`, dépendance `supertest`) — aucun test e2e n'est prévu sur ce projet
- [ ] Configurer Jest avec rapport de couverture (seuil minimum 80% sur les modules core), backend et frontend
- [ ] Passer tous les tests unitaires définis en v0.1, v0.2, v0.3 et v0.4 au vert (aucun test e2e prévu — hors scope du projet)
- [ ] Cahier de recette — vérifier manuellement CR-01 à CR-12 :
  - [ ] CR-01 : Inscription email valide → OTP reçu
  - [ ] CR-02 : Email déjà utilisé → erreur claire
  - [ ] CR-03 : OTP correct → accès accordé
  - [ ] CR-04 : OTP expiré → message d'erreur
  - [ ] CR-05 : Saisie cycle → phase correcte dans le calendrier
  - [ ] CR-06 : Vue mensuelle → 4 bandes de couleur visibles
  - [ ] CR-07 : Événement en menstruation déplaçable → suggestion proposée
  - [ ] CR-08 : Accepter une suggestion → événement déplacé
  - [ ] CR-09 : Import Google Calendar → événements visibles
  - [ ] CR-10 : Recherche "Boxe" → résultats filtrés
  - [ ] CR-11 : Accepter invitation → statut "Accepté"
  - [ ] CR-12 : Token expiré → 401 + refresh automatique

### Accessibilité (WCAG AA)
- [x] Vérifier ratio de contraste violet #6B3FA0 sur fond blanc (≥ 4.5:1) — 7.38:1, conforme (calcul luminance relative WCAG). Au passage, couleurs de phase vérifiées aussi (`utils/theme.ts`) : traits de phase 4.10–12.99:1 vs blanc (seuil 3:1 non-textuel), contour du jour suggéré 4.10:1
- [ ] Ajouter `accessibilityLabel` sur tous les boutons et éléments interactifs
- [ ] Vérifier tailles de zones tactiles ≥ 44×44 dp
- [ ] Tester avec VoiceOver (iOS) et TalkBack (Android)
- [ ] Chaque phase du cycle a couleur + icône + label texte (pas de dépendance couleur seule)

### RGPD
- [ ] Ajouter `DELETE /users/me` → suppression en cascade de toutes les données
- [ ] Écran de consentement explicite lors de l'onboarding (avant la saisie du cycle)
- [ ] Vérifier le chiffrement des colonnes de données de cycle en BDD

### Build Expo
- [ ] Configurer `eas.json` pour EAS Build (profiles development, preview, production)
- [ ] `eas build --platform all --profile preview` → générer les binaires de test

---

## Backlog post-MVP (hors scope)

- Abonnement premium / Stripe
- Journalisation des symptômes
- Partage de calendrier avec un partenaire
- Notifications push avancées
- Passkey / 2FA SMS (P2 — optionnel)
- Bouton "Continuer avec Apple / Google" (SSO)
- **Vue Semaine/Jour** (maquette `Figma/Vue jours.png` et `Figma/semaine.png`) — agenda horaire par jour avec sélecteur de jours de la semaine en haut, statuts d'invitation par couleur de bloc (déclinée = gris, en attente = contour blanc, peut-être = beige), icône de récurrence, temps de trajet avant événement
- **Vue Année** (maquette `Figma/Vue année.png`) — grille des 12 mois miniatures, mêmes boutons bas de page (Aujourd'hui / Calendriers) et FAB que la vue mois
- **Import des données de cycle depuis Flo/Clue** (maquette `Figma/Import autres calendriers-1.png`) — écran "Récupérons vos données de cycle", distinct de l'import de calendriers externes
