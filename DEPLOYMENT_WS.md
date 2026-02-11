# Déploiement (WebSocket / PM2 / Docker)

Ce document décrit deux options de déploiement pour l'application Unify — soit via `pm2` (process manager pour Node), soit via `Docker` (image construite depuis le repo). Le serveur custom `server.js` expose les WebSocket et doit être utilisé en production.

Pré-requis:
- Variables d'environnement: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, et autres clés utilisées par l'app.
- Base de données accessible depuis le serveur.
- Si vous utilisez Prisma migrations en prod, exécutez `npx prisma migrate deploy`.

Option A — PM2
1. Sur le serveur, installez Node.js et PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

2. Copiez le code sur le serveur (git clone / rsync) et installez les dépendances:

```bash
npm ci --production=false
npx prisma generate
npm run build
```

3. Démarrer avec PM2 (nous fournissons `ecosystem.config.js`):

```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

4. Pour déployer une nouvelle version: pull, `npm ci`, `npx prisma migrate deploy`, `npm run build`, puis `pm2 reload ecosystem.config.js`.

Option B — Docker
1. Construire l'image localement:

```bash
docker build -t ghcr.io/<OWNER>/<REPO>:latest .
```

2. Exécuter en container (exemple minimal):

```bash
docker run -d --name unify -p 3000:3000 \
  -e DATABASE_URL='postgres://...' \
  -e NEXTAUTH_URL='https://example.com' \
  -e NEXTAUTH_SECRET='...' \
  ghcr.io/<OWNER>/<REPO>:latest
```

3. Si vous utilisez un orchestrateur (Docker Compose / Kubernetes), adaptez le service et assurez-vous d'exposer les ports WebSocket.

Notes importantes:
- Assurez-vous d'appliquer la migration Prisma (`npx prisma migrate deploy`) avant de commencer à utiliser la fonctionnalité `isLiked` persistante.
- Pour la scalabilité WebSocket: si vous déployez plusieurs instances derrière un load balancer, vous aurez besoin d'un broker/pubsub (Redis) ou d'une stratégie d'affinité (sticky sessions) pour acheminer correctement les connexions WebSocket vers la même instance.
