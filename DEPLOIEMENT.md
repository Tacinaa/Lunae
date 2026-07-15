# Déploiement — Backend Lunae

## Architecture cible

| Composant | Service |
|-----------|---------|
| API NestJS | Railway (conteneur Docker) |
| Base de données PostgreSQL | Railway (plugin managé) |
| Registre d'image | build Docker géré directement par Railway (pas de registry externe) |

Le backend est packagé en image Docker multi-stage (`apps/backend/Dockerfile`, testée en conditions
réelles — cf. `TODO.md`). Railway construit et déploie cette image directement à partir du repo,
sans étape de push manuel vers un registre.

## État actuel

**Le déploiement n'est pas encore activé.** La configuration (ce document, `railway.json`, le job
`deploy` du pipeline CI) est prête, mais aucune instance Railway n'est en ligne : ni compte, ni
service créé. Décision délibérée pour la temporalité du projet : le Bloc 2 (dossier écrit) exige de
documenter le protocole de déploiement, pas d'avoir une instance active en permanence. L'activation
réelle (compte Railway, plan Hobby à 5$/mois) est prévue à l'approche du Bloc 3 (soutenance/démo),
pour éviter un coût récurrent sur plusieurs mois sans utilité pendant la rédaction du dossier.

## Manuel de déploiement (première mise en service, manuelle)

Prérequis : compte Railway (gratuit à la création), `railway` CLI (`npm install -g @railway/cli`,
ou via `npx @railway/cli`).

```bash
# 1. Authentification (ouvre le navigateur)
railway login

# 2. Depuis apps/backend/ — lie ce dossier à un nouveau projet Railway
cd apps/backend
railway init

# 3. Ajoute une instance PostgreSQL managée au projet — injecte automatiquement
#    DATABASE_URL dans les variables d'environnement du service
railway add --database postgresql

# 4. Définit les variables d'environnement applicatives (cf. section suivante)
railway variables set JWT_SECRET="..."
railway variables set JWT_REFRESH_SECRET="..."
railway variables set CYCLE_DATA_ENCRYPTION_KEY="..."
railway variables set GOOGLE_TOKEN_ENCRYPTION_KEY="..."
railway variables set GOOGLE_ANDROID_CLIENT_ID="..."
railway variables set GOOGLE_IOS_CLIENT_ID="..."
railway variables set SMTP_HOST="..." SMTP_PORT="587" SMTP_USER="..." SMTP_PASS="..." SMTP_FROM="..."
# NODE_ENV=production et PORT sont gérés automatiquement par Railway — ne pas les fixer manuellement

# 5. Applique les migrations Prisma sur la base Railway
railway run npx prisma migrate deploy

# 6. Build + déploiement (détecte railway.json → build via Dockerfile)
railway up

# 7. Récupère l'URL publique générée (à reporter dans EXPO_PUBLIC_API_URL côté frontend)
railway domain
```

## Protocole de déploiement continu (CI/CD)

Le job `deploy` du pipeline GitHub Actions (`.github/workflows/ci.yml`) automatise les étapes 5 et 6
ci-dessus à chaque push sur `master`, une fois que le job `backend` (lint + tests + build) est passé
au vert :

```
push sur master
      │
      ▼
  job backend (lint, tests, build)  ──✗──► pipeline en échec, pas de déploiement
      │ ✓
      ▼
  job deploy
      │
      ├─ secret RAILWAY_TOKEN absent ──► job no-op (log explicite, pas d'échec)
      │
      └─ secret présent
            │
            ▼
      railway run npx prisma migrate deploy   (migrations sur la base de production)
            │
            ▼
      railway up --service backend --detach   (build + déploiement de la nouvelle image)
```

Le job est volontairement gardé inactif tant que le secret `RAILWAY_TOKEN` n'existe pas dans les
paramètres du repo (`Settings > Secrets and variables > Actions`) — il ne fait rien et ne fait pas
échouer la CI, plutôt que de tenter un déploiement vers un projet qui n'existe pas encore.

**Pour activer le déploiement continu** (à faire avant le Bloc 3) :
1. Suivre le manuel ci-dessus une première fois (création du projet + variables).
2. Générer un token de déploiement : `railway login` puis `railway tokens create` (ou depuis le
   dashboard Railway : Project Settings → Tokens).
3. Ajouter ce token comme secret `RAILWAY_TOKEN` dans les paramètres GitHub Actions du repo.
4. Le prochain push sur `master` déclenche automatiquement le déploiement.

## Variables d'environnement de production

Voir `apps/backend/.env.example` pour la liste complète et les commandes de génération des clés de
chiffrement (32 octets aléatoires, encodées en base64). Ne jamais committer les valeurs réelles —
seul `DATABASE_URL` est injecté automatiquement par le plugin PostgreSQL de Railway.

## Frontend

Une fois le backend en ligne, mettre à jour `EXPO_PUBLIC_API_URL` (dans `apps/frontend/.env.local`,
ou en variable d'environnement du profil EAS Build correspondant) avec l'URL publique Railway
(`https://<projet>.up.railway.app/api`) plutôt que l'IP locale utilisée en développement.
