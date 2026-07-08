# Lunae — CLAUDE.md

## Projet
Lunae est une application mobile (React Native Expo) couplée à une API REST (NestJS) qui combine **agenda personnel** et **suivi du cycle menstruel**. Le principe central : suggérer proactivement le déplacement d'événements selon la phase du cycle pour optimiser énergie et productivité.

## Stack
| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + Expo SDK 52 |
| Navigation | React Navigation v7 |
| State | Zustand |
| HTTP client | Axios + intercepteurs JWT |
| Backend | NestJS v10 |
| ORM | Prisma v5 |
| Base de données | PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 30j) + OTP email 6 chiffres |
| Calendriers externes | CalDAV + Google Calendar API |
| CI/CD | GitHub Actions → Railway/Render |

## Structure du repo (monorepo)
```
lunae/
├── apps/
│   ├── frontend/     # Expo app
│   └── backend/      # NestJS API
├── .github/
│   └── workflows/    # CI/CD
└── TODO.md
```

## Modules backend
- `AuthModule` — inscription, connexion, OTP, JWT, refresh tokens
- `UserModule` — profil, préférences
- `CycleModule` — saisie, historique, algorithme de calcul des phases, prédictions
- `CalendarModule` — CRUD événements, import CalDAV/Google
- `RecommendationModule` — suggestions de déplacement
- `InvitationModule` — invitations reçues/répondues

## Algorithme de cycle (sans dépendance externe)
```
ovulationDay = cycleLength - 14
Menstruation : J0 → J0 + periodDuration - 1
Folliculaire  : J0 + periodDuration → J0 + ovulationDay - 2
Ovulation     : J0 + ovulationDay - 1 → J0 + ovulationDay + 1
Lutéale       : J0 + ovulationDay + 2 → J0 + cycleLength - 1
```

## Sécurité
- bcrypt rounds: 12
- OTP: 6 chiffres, valide 10 min, usage unique, stocké haché
- Rate limiting auth: max 5 tentatives / 15 min
- Données de cycle chiffrées au repos (AES-256)
- HTTPS / TLS 1.3 obligatoire

## Conventions
- TypeScript strict partout
- Validation backend avec `class-validator`
- Tests unitaires avec Jest (couverture cycle + auth + recommendations obligatoire)
- Accessibilité WCAG AA (ratio contraste 4.5:1 min, zones tactiles 44×44 dp)
- Palette principale : violet #6B3FA0

## Phases du cycle — couleurs et scores
| Phase | Couleur | Score suggestion |
|-------|---------|-----------------|
| Menstruation | Rouge | 0 (déconseillé) |
| Folliculaire | Violet/bleu | 2 (bon) |
| Ovulation | Vert | 3 (optimal) |
| Lutéale | Orange | 1 (acceptable) |
