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

---

## Prérequis

- [ ] Créer un projet **Sentry** (offre gratuite) et récupérer les DSN backend et frontend
- [ ] Créer un compte **UptimeRobot** (offre gratuite)
- [ ] Installer un tunnel HTTP local : `cloudflared` (`brew install cloudflared`) ou `ngrok`

---

## 1. Supervision et alerte

Objectif : garantir la disponibilité permanente de l'application par la mise en place de
sondes, d'indicateurs de suivi et de canaux d'alerte.

### 1.1 Sonde de santé applicative

- [ ] Ajouter la dépendance : `npm i @nestjs/terminus`
- [ ] Implémenter un `HealthModule` exposant `GET /health`
- [ ] Contrôles à couvrir : connectivité PostgreSQL (Prisma), consommation mémoire (heap), espace disque
- [ ] Valider la réponse en local : `curl http://localhost:3000/health`

Preuve à archiver : réponse JSON de `/health` détaillant l'état de chaque sonde.

### 1.2 Suivi des erreurs applicatives (Sentry)

- [ ] Backend : `npm i @sentry/nestjs`, initialisation avec le DSN backend
- [ ] Frontend : `npx expo install @sentry/react-native`, initialisation avec le DSN frontend
- [ ] Générer une erreur de contrôle côté backend et côté frontend pour valider la remontée
- [ ] Configurer une règle d'alerte (notification par e-mail à chaque nouvelle anomalie)

Preuves à archiver : liste des issues Sentry, détail d'une issue (stacktrace et contexte),
règle d'alerte configurée, e-mail de notification reçu.

### 1.3 Surveillance de disponibilité (UptimeRobot)

- [ ] Exposer l'endpoint de santé via le tunnel :
  `cloudflared tunnel --url http://localhost:3000`
- [ ] Déclarer un moniteur HTTP(s) UptimeRobot pointant vers `<url-tunnel>/health` (intervalle 5 min)
- [ ] Laisser le moniteur collecter des données sur 24 à 48 h afin de disposer d'un taux de disponibilité représentatif
- [ ] Réaliser un test d'indisponibilité contrôlé (arrêt du service quelques minutes) pour valider la chaîne d'alerte

Indicateurs de suivi retenus : taux de disponibilité, temps de réponse, statut des sondes.

Preuves à archiver : tableau de bord de disponibilité (taux et temps de réponse),
enregistrement de l'incident dans le journal du moniteur, e-mail d'alerte d'indisponibilité.

---

## 2. Gestion des dépendances

Objectif : maintenir les bibliothèques tierces à jour et sécurisées, avec un processus
défini en fréquence, périmètre et mode d'exécution.

- [ ] Activer **Dependabot** via `.github/dependabot.yml` (écosystèmes npm backend et frontend)
- [ ] Contrôler l'état courant : `npm outdated` (backend), `npx expo-doctor` (frontend)

Processus retenu :

- Fréquence : hebdomadaire (analyse automatique Dependabot)
- Périmètre : dépendances backend et frontend du monorepo
- Mode : semi-automatique — ouverture automatique des pull requests, validation et fusion manuelles après passage de l'intégration continue

Preuves à archiver : fichier `dependabot.yml`, pull request de mise à jour générée
automatiquement, sortie de `expo-doctor` / `npm outdated`.

---

## 3. Consignation et traitement des anomalies

### 3.1 Processus de consignation

Objectif : collecter et consigner les anomalies de manière structurée afin de déterminer
le correctif à mettre en place.

- [ ] Créer un modèle d'issue `.github/ISSUE_TEMPLATE/bug_report.md`
      (description, étapes de reproduction, comportement attendu et observé, environnement, gravité, capture)
- [ ] Consigner une anomalie réelle à l'aide de ce modèle (source : remontée Sentry ou anomalie identifiée)

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

- [ ] Maintenir un fichier `CHANGELOG.md` au format Keep a Changelog
- [ ] Documenter chaque version par sections `Added`, `Changed`, `Fixed`
- [ ] Consolider l'historique existant (v0.1 à v1.0) et ajouter la version intégrant le correctif de la section 3.2
- [ ] Taguer les versions (`git tag`) et publier les releases correspondantes

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
