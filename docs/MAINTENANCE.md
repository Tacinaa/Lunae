# Plan de mise en condition opérationnelle — Lunae

Ce document décrit la mise en place de la supervision, de la gestion des dépendances,
du traitement des anomalies et du suivi des versions de l'application Lunae. Il sert de
référence opérationnelle pour maintenir l'application en condition opérationnelle et de
support de traçabilité pour les tâches associées.

Environnement de référence : backend NestJS, frontend React Native (Expo), base
PostgreSQL, intégration continue GitHub Actions. La supervision est instrumentée à coût
nul via des offres gratuites (Sentry, UptimeRobot) et un tunnel HTTP, sans dépendance à
un hébergement de production payant.

Chaque section précise les tâches à réaliser et les preuves à archiver (captures,
fichiers de configuration) sous `docs/preuves/`.


> Les captures de preuves sont conservées hors du dépôt (données personnelles) et regroupées dans les annexes du dossier de certification.

---

## Prérequis

- [x] Créer un projet **Sentry** (offre gratuite) et récupérer les DSN backend et frontend
  — projets créés (région EU), DSN récupérés et câblés (cf. 1.2)
- [x] Créer un compte **UptimeRobot** (offre gratuite)
- [x] Installer un tunnel HTTP local : `cloudflared` (`brew install cloudflared`) ou `ngrok`

> Note de suivi (2026-08-10) : les tâches ci-dessous sont réparties entre ce qui est du
> code (implémentable sans compte externe) et ce qui suppose la création d'un compte
> tiers (Sentry, UptimeRobot) ou une action humaine (test utilisateur, tunnel). La partie
> code a été traitée ; le reste est signalé explicitement item par item.

---

## 1. Supervision et alerte

Objectif : garantir la disponibilité permanente de l'application par la mise en place de
sondes, d'indicateurs de suivi et de canaux d'alerte.

### 1.1 Sonde de santé applicative

- [x] Ajouter la dépendance : `npm i @nestjs/terminus`
- [x] Implémenter un `HealthModule` exposant `GET /health` — `apps/backend/src/health/`
  (`HealthController`, `PrismaHealthIndicator`), route exclue du préfixe global `api`
  (`main.ts`) pour rester à `/health`, `@Public()` (pas de JWT requis, cohérent avec un
  usage par un moniteur externe)
- [x] Contrôles à couvrir : connectivité PostgreSQL (Prisma, `SELECT 1` via
  `PrismaHealthIndicator`), consommation mémoire (heap, seuil 300 Mo), espace disque
  (seuil 90%)
- [x] Valider la réponse en local : `curl http://localhost:3000/health` — testé le
  2026-08-10 avec la base PostgreSQL locale (`docker compose up -d`) : `200 OK`, les
  3 sondes `up`

Preuve archivée : `docs/preuves/health-check-response.json`.

### 1.2 Suivi des erreurs applicatives (Sentry)

- [x] Backend : `npm i @sentry/nestjs`, initialisation conditionnelle sur `SENTRY_DSN`
  (`apps/backend/src/instrument.ts`, importé en tout premier dans `main.ts` — exigence du
  SDK) + `SentryModule.forRoot()`/`SentryGlobalFilter` dans `app.module.ts`. Reste inactif
  tant que `SENTRY_DSN` n'est pas défini (même logique que le job `deploy`/`RAILWAY_TOKEN`)
- [x] Frontend : `npx expo install @sentry/react-native`, initialisation conditionnelle sur
  `EXPO_PUBLIC_SENTRY_DSN` (`App.tsx`, `Sentry.init` + `Sentry.wrap(App)`)
- [x] Backend : `SENTRY_DSN` renseigné dans `apps/backend/.env` (non commité) — erreur de
  contrôle envoyée via le SDK réellement configuré (`instrument.ts`), réponse HTTP de
  l'endpoint d'ingestion Sentry `200` (contre-exemple avec un DSN invalide : `403`, ce qui
  écarte un faux positif). Preuve : `docs/preuves/sentry-backend-control-error.txt`. Issue
  confirmée visuellement dans le dashboard Sentry (capture d'écran, cf. toi)
- [x] Frontend : `EXPO_PUBLIC_SENTRY_DSN` renseigné dans `apps/frontend/.env.local` (non
  commité). Validation faite via un bouton temporaire "Test Sentry (dev)" ajouté sur
  `MainCalendarScreen` (`Sentry.captureException(...)`, sous `__DEV__`), déclenché depuis
  l'app réelle (`expo start --dev-client`), issue confirmée dans le dashboard Sentry
  (capture d'écran) puis bouton retiré une fois la validation faite — voir historique Git
  pour le détail si besoin de le reproduire
- [x] Configurer une règle d'alerte (notification par e-mail à chaque nouvelle anomalie)
  — depuis le dashboard Sentry, Alerts > Create Alert Rule ; e-mail de notification reçu
  et vérifié

Preuves archivées : `docs/preuves/sentry-backend-control-error.txt`,
`docs/preuves/screens/sentry-backend-issue.png`,
`docs/preuves/screens/sentry-backend-stacktrace.png`,
`docs/preuves/screens/sentry-backend-contexte.png`,
`docs/preuves/screens/sentry-backend-alerte-conditions.png`,
`docs/preuves/screens/sentry-backend-alerte-liste.png`,
`docs/preuves/screens/sentry-backend-alerte-email.png`,
`docs/preuves/screens/sentry-frontend-issue.png`,
`docs/preuves/screens/sentry-frontend-breadcrumbs.png`.

### 1.3 Surveillance de disponibilité (UptimeRobot)

- [x] Exposer l'endpoint de santé via le tunnel :
  `cloudflared tunnel --url http://localhost:3000`
- [x] Déclarer un moniteur HTTP(s) UptimeRobot pointant vers `<url-tunnel>/health` (intervalle 5 min)
- [ ] Laisser le moniteur collecter des données sur 24 à 48 h afin de disposer d'un taux de disponibilité représentatif
- [x] Réaliser un test d'indisponibilité contrôlé pour valider la chaîne d'alerte — incident
  502 provoqué, détecté par UptimeRobot, confirmé multi-régions, alerte e-mail reçue, puis
  résolu (durée de l'incident : 5 min 7 s), cycle complet capturé

Indicateurs de suivi retenus : taux de disponibilité, temps de réponse, statut des sondes.

Preuves archivées : `docs/preuves/screens/uptime-tunnel-actif.png`,
`docs/preuves/screens/uptime-health-via-tunnel.png`,
`docs/preuves/screens/uptime-monitor-config.png`,
`docs/preuves/screens/uptime-dashboard-up.png`,
`docs/preuves/screens/uptime-dashboard-down.png`,
`docs/preuves/screens/uptime-alerte-email.png`,
`docs/preuves/screens/uptime-incident-log.png`.

---

## 2. Gestion des dépendances

Objectif : maintenir les bibliothèques tierces à jour et sécurisées, avec un processus
défini en fréquence, périmètre et mode d'exécution.

- [x] Activer **Dependabot** via `.github/dependabot.yml` (écosystèmes npm backend et
  frontend, groupés `@nestjs/*` / `expo*`, fréquence hebdomadaire) — la première
  pull request automatique ne sera générée qu'après le push de ce fichier sur `master`
- [x] Contrôler l'état courant : `npm outdated` (backend), `npx expo-doctor` (frontend) —
  exécuté le 2026-08-10, résultats archivés (voir preuves). `expo-doctor` a signalé une
  dépendance native manquante réelle (`expo-font`, peer dependency de
  `@expo/vector-icons`, risque de crash hors Expo Go) : corrigée dans la foulée
  (`npx expo install expo-font`), tests et typecheck revérifiés au vert. Preuve
  avant/après conservée séparément (`expo-doctor-frontend-before.txt` /
  `-after.txt`) : le "before" a été reproduit en désinstallant temporairement
  `expo-font` puis en le réinstallant à l'identique, la première capture ayant été
  écrasée par erreur par la seconde exécution. Les autres écarts (mineurs/patch,
  `eas-cli` en dépendance directe) sont des désynchronisations de version courantes,
  sans action requise dans l'immédiat

Processus retenu :

- Fréquence : hebdomadaire (analyse automatique Dependabot)
- Périmètre : dépendances backend et frontend du monorepo
- Mode : semi-automatique — ouverture automatique des pull requests, validation et fusion manuelles après passage de l'intégration continue

Preuves à archiver : fichier `dependabot.yml` (fait, cf. `.github/dependabot.yml`), pull
request de mise à jour générée automatiquement (à archiver après le premier passage
Dependabot sur le repo GitHub), sortie de `expo-doctor` / `npm outdated` — archivées dans
`docs/preuves/npm-outdated-backend.txt` et `docs/preuves/expo-doctor-frontend-before.txt`
(anomalie détectée) / `-after.txt` (anomalie corrigée).

---

## 3. Consignation et traitement des anomalies

### 3.1 Processus de consignation

Objectif : collecter et consigner les anomalies de manière structurée afin de déterminer
le correctif à mettre en place.

- [x] Créer un modèle d'issue `.github/ISSUE_TEMPLATE/bug_report.md`
      (description, étapes de reproduction, comportement attendu et observé, environnement, gravité, capture)
- [ ] Consigner une anomalie réelle à l'aide de ce modèle (source : remontée Sentry ou
  anomalie identifiée) — à faire une fois le modèle poussé sur `master` (une issue GitHub
  n'est pas quelque chose que je peux créer en ton nom, cf. accès au dépôt)

Le champ « étapes de reproduction » doit permettre de reproduire l'anomalie de façon
déterministe.

Preuves à archiver : modèle d'issue, fiche de consignation renseignée.

### 3.2 Correctif et déploiement

Objectif : résoudre l'anomalie en s'appuyant sur le processus d'intégration et de
déploiement continu.

- [ ] Créer une branche `fix/<identifiant>`, implémenter le correctif, ouvrir une pull request
- [ ] Confirmer le passage au vert de l'intégration continue (lint, tests) sur la pull request
- [ ] Fusionner sur `master`

Note : le job de déploiement du pipeline reste inactif tant que le secret `RAILWAY_TOKEN`
n'est pas configuré ; le processus d'intégration continue est néanmoins opérationnel et le
déploiement configuré.

Preuves à archiver : pull request avec contrôles d'intégration validés, détail du run
GitHub Actions.

---

## 4. Journal des versions

Objectif : suivre les évolutions et les correctifs déployés sur l'application.

- [x] Maintenir un fichier `CHANGELOG.md` au format Keep a Changelog — `CHANGELOG.md` à la
  racine du repo
- [x] Documenter chaque version par sections `Added`, `Changed`, `Fixed`
- [x] Consolider l'historique existant (v0.1 à v1.0) à partir de `docs/TODO.md` et de
  l'historique Git — une entrée `[Non publié]` couvre déjà le travail de ce Bloc 4 (santé,
  Sentry, Dependabot, modèle d'issue)
- [ ] Ajouter la version intégrant le correctif de la section 3.2 — dépend qu'un correctif
  réel soit d'abord mergé (section 3.2)
- [ ] Taguer les versions (`git tag`) et publier les releases correspondantes — action
  Git à valider avec toi avant exécution (création de tags + releases publiques sur le
  dépôt GitHub)

Les correctifs déployés doivent être documentés explicitement, au même titre que les
nouvelles fonctionnalités.

Preuves à archiver : `CHANGELOG.md`, page des releases du dépôt.

---

## 5. Retours utilisateurs et support

Objectif : documenter la résolution d'un problème remonté par un utilisateur, en
collaboration avec les parties prenantes.

- [ ] Conduire une session de test avec un utilisateur et recueillir un retour sur un cas d'usage réel
- [ ] Documenter l'échange : contexte du retour, diagnostic, résolution apportée, contribution de chaque partie prenante

Preuve à archiver : retour utilisateur d'origine (message ou capture).

---

## 6. Axes d'amélioration

Objectif : formuler des recommandations argumentées à partir des indicateurs collectés.

- [ ] Relever les métriques issues de la supervision (temps de réponse, taux d'erreur, taux de disponibilité)
- [ ] Formuler des axes d'amélioration chiffrés (gain de performance, coût, délai de mise en œuvre)

Preuve à archiver : panneau de métriques de performance (Sentry).

---

## Annexe — Traçabilité des compétences (RNCP 39583, Bloc 4)

| Compétence | Éliminatoire | Section |
|---|---|---|
| C4.1.1 — Gestion des mises à jour des dépendances | Non | 2 |
| C4.1.2 — Système de supervision et d'alerte | Oui | 1 |
| C4.2.1 — Consignation des anomalies | Oui | 3.1 |
| C4.2.2 — Création et déploiement d'un correctif | Non | 3.2 |
| C4.3.1 — Axes d'amélioration | Non | 6 |
| C4.3.2 — Journal des versions déployées | Oui | 4 |
| C4.3.3 — Collaboration avec le support | Non | 5 |
