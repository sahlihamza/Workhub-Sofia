# Workhub Sofia

Application de gestion des ressources humaines composée de deux projets :

- **Frontend** : Angular 14 dans [`Work-Hub-Sofia_Frontend`](./Work-Hub-Sofia_Frontend)
- **Backend** : NestJS 11 dans [`Work-Hub-Sofia-Backend`](./Work-Hub-Sofia-Backend)
- **Base de données** : MySQL

## Prérequis

Installer les outils suivants avant de commencer :

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20 LTS recommandé
- npm (installé avec Node.js)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) 8 ou une version compatible
- MySQL Workbench (optionnel, mais pratique pour créer la base et exécuter le SQL)

Pour le déploiement local avec Docker Desktop, seul
[Docker Desktop](https://www.docker.com/products/docker-desktop/) est nécessaire.

## Lancement depuis le terminal VS Code sans Docker

La configuration VS Code reste séparée de Docker :

- le backend lit [Work-Hub-Sofia-Backend/.env](./Work-Hub-Sofia-Backend/.env) ;
- ce fichier utilise MySQL local sur `localhost:3306` avec l'utilisateur
  `root` ;
- le seed automatique Docker ne s'applique pas au lancement `npm run start:dev`.

Préparer la configuration locale :

```powershell
cd Work-Hub-Sofia-Backend
Copy-Item .env.example .env
npm install
npm run start:dev
```

Dans un deuxième terminal :

```powershell
cd Work-Hub-Sofia_Frontend
npm install
npm start
```

Le frontend est disponible sur `http://localhost:4200` et le backend local sur
`http://localhost:3000`. En Docker, le backend est exposé sur
`http://localhost:3001` et le frontend sur `http://localhost:4201` pour éviter
les conflits avec les serveurs locaux.

## Démarrage avec Docker Desktop

Cette configuration lance automatiquement :

- MySQL 8.4 avec un volume persistant, exposé sur `localhost:3307` ;
- phpMyAdmin sur `http://localhost:8080` ;
- le backend NestJS sur `http://localhost:3001` ;
- le frontend Angular servi par Nginx sur `http://localhost:4201`.

Les variables Docker sont définies dans [`.env`](./.env) à la racine et leur
modèle est disponible dans [`.env.example`](./.env.example). Le fichier
`.env` racine est ignoré par Git. Il est différent du fichier
`Work-Hub-Sofia-Backend/.env` utilisé par le lancement depuis VS Code.

1. Ouvrir Docker Desktop.
2. Depuis la racine du dépôt, créer ou vérifier le fichier `.env` :

```powershell
Copy-Item .env.example .env
```

Ne pas exécuter cette commande si le fichier `.env` local existe déjà avec vos
valeurs. Pour l'envoi d'e-mails ou les jours fériés, renseigner les clés SMTP
et Calendarific dans ce fichier.

3. Construire et démarrer les trois services :

```powershell
docker compose up --build -d
```

MySQL est déclaré sain avant le démarrage du backend et les migrations sont
exécutées automatiquement. Au premier démarrage, le seed complet (`npm run
seed`) est lancé automatiquement après les migrations. Un marqueur est stocké
dans un volume Docker afin de ne pas relancer le seed aux redémarrages
suivants. Consulter les logs avec :

```powershell
docker compose logs -f backend
```

Ouvrir ensuite [http://localhost:4201](http://localhost:4201). phpMyAdmin est
disponible sur [http://localhost:8080](http://localhost:8080). Connecter phpMyAdmin avec l'hôte `mysql`, l'utilisateur `root` et un mot de passe
vide, comme la configuration MySQL locale du backend.

Le seed crée
notamment le superadministrateur de développement :

```powershell
Email : `admin@gmail.com`
Mot de passe : `admin 123`
```

Le seed automatique Docker est normalement suffisant. Pour le lancer
manuellement dans le conteneur :

```powershell
docker compose exec backend npm run seed
```

Si le compte existe déjà mais refuse le mot de passe, réinitialiser uniquement
son mot de passe avec la configuration `.env` alignée sur Docker :

```powershell
npm run seed:superadmin:reset
```

Cette commande ne supprime aucune donnée. Elle réenregistre le compte
`admin@gmail.com` avec le mot de passe `admin 123`.

Pour arrêter les services sans supprimer les données MySQL :

```powershell
docker compose down
```

Pour supprimer également le volume MySQL et repartir d'une base vide :

```powershell
docker compose down -v
```

La commande `down -v` supprime aussi le marqueur du seed. Le prochain
`docker compose up` relancera donc automatiquement le seed.

Les fichiers Docker sont [docker-compose.yml](./docker-compose.yml),
[Work-Hub-Sofia-Backend/Dockerfile](./Work-Hub-Sofia-Backend/Dockerfile),
[Work-Hub-Sofia_Frontend/Dockerfile](./Work-Hub-Sofia_Frontend/Dockerfile) et
[Work-Hub-Sofia_Frontend/nginx.conf](./Work-Hub-Sofia_Frontend/nginx.conf).

## Images Docker publiées par GitHub Actions

Le workflow [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml)
compile le backend, valide Compose et publie automatiquement les images sur
GitHub Container Registry après chaque push sur `main` :

```text
ghcr.io/sahlihamza/workhub-sofia-backend:latest
ghcr.io/sahlihamza/workhub-sofia-frontend:latest
```

Pour utiliser les dernières images dans Docker Desktop :

```powershell
docker login ghcr.io
docker compose -f docker-compose.registry.yml pull
docker compose -f docker-compose.registry.yml up -d
```

Pour récupérer une nouvelle version après un nouveau push :

```powershell
docker compose -f docker-compose.registry.yml pull
docker compose -f docker-compose.registry.yml up -d
```

Ces commandes sont également regroupées dans le script
[`update-docker.ps1`](./update-docker.ps1). Depuis PowerShell, lancer :

```powershell
.\update-docker.ps1
```

Le workflow CI s'exécute aussi sur les pull requests, mais la publication
GHCR est réservée aux pushes sur `main`. Si les packages GHCR sont privés,
`docker login ghcr.io` demandera un token GitHub avec la permission
`read:packages`. Si les packages sont publics, cette connexion n'est pas
nécessaire pour le téléchargement.

Vérifier les installations :

```bash
node --version
npm --version
mysql --version
```

## 1. Télécharger le projet

```bash
git clone https://github.com/sahlihamza/Workhub-Sofia.git
cd Workhub-Sofia
```

Le frontend et le backend sont deux applications indépendantes. Il faut installer
leurs dépendances séparément.

## 2. Préparer MySQL

Créer la base de données utilisée par le backend :

```sql
CREATE DATABASE WorkHubSofia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Pour un démarrage sans Docker, la configuration par défaut du backend utilise :

| Paramètre | Valeur actuelle |
| --- | --- |
| Hôte | `localhost` |
| Port | `3306` |
| Utilisateur | `root` |
| Mot de passe | vide |
| Base | `WorkHubSofia` |

Ces valeurs peuvent être modifiées dans
[`Work-Hub-Sofia-Backend/.env`](./Work-Hub-Sofia-Backend/.env). Avec Docker,
le backend utilise le nom de service `mysql` et les valeurs du fichier `.env`
racine.

### Schéma de la base

Le backend utilise `synchronize: false` et exécute automatiquement les
migrations au démarrage (`DB_MIGRATIONS_RUN=true` par défaut). La migration
disponible se trouve dans :

[`Work-Hub-Sofia-Backend/src/migrations/1755178998587-UpdateDatabase.ts`](./Work-Hub-Sofia-Backend/src/migrations/1755178998587-UpdateDatabase.ts)

Après avoir créé la base `WorkHubSofia`, lancez le backend. TypeORM créera les
tables et enregistrera la migration dans la table `migrations`. Vérifiez que
les tables suivantes existent :

```text
user
departement
equipe
postes
planning
demande_conge
```

Pour désactiver l'exécution automatique des migrations, ajoutez
`DB_MIGRATIONS_RUN=false` dans `.env`. Ne pas utiliser `DB_SYNCHRONIZE=true`
sur une base contenant des données sans validation préalable.

## 3. Configurer les variables du backend

Copier le modèle fourni, puis remplacer toutes les valeurs d'exemple :

```bash
cd Work-Hub-Sofia-Backend
cp .env.example .env
```

Sous PowerShell Windows :

```powershell
Copy-Item .env.example .env
```

Le modèle se trouve dans
[`Work-Hub-Sofia-Backend/.env.example`](./Work-Hub-Sofia-Backend/.env.example).
Le fichier réellement utilisé par l'application est
`Work-Hub-Sofia-Backend/.env` :

```env
JWT_SECRET=changez-cette-valeur
JWT_ACCESS_SECRET=changez-cette-valeur
JWT_REFRESH_SECRET=changez-cette-valeur
PASSWORD_SECRET=changez-cette-valeur

FRONTEND_URL=http://localhost:4200

# Requis uniquement pour l'envoi d'e-mails avec Brevo/SMTP
SENDINBLUE_EMAIL=votre-adresse-email
SENDINBLUE_API_KEY=votre-cle-api

# Requis uniquement pour les jours fériés
CALENDARIFIC_API_KEY=votre-cle-api-calendarific

# Optionnel : le backend utilise 3000 par défaut
PORT=3000
```

Les variables suivantes sont utilisées par le code : `JWT_SECRET`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PASSWORD_SECRET`, `FRONTEND_URL`,
`SENDINBLUE_EMAIL`, `SENDINBLUE_API_KEY`, `CALENDARIFIC_API_KEY` et `PORT`.

Ne jamais commit le fichier `.env`, une clé API ou un vrai mot de passe.
Le fichier `.env` est ignoré par Git ; seul `.env.example`, qui ne contient
aucun secret réel, est versionné.

Le backend accepte les requêtes CORS du frontend local à l'adresse
`http://localhost:4200`.

## 4. Installer et démarrer le backend

Ouvrir un terminal à la racine du dépôt :

```bash
cd Work-Hub-Sofia-Backend
npm ci
```

Pour démarrer en mode développement avec rechargement automatique :

```bash
npm run start:dev
```

Le backend sera disponible sur :

```text
http://localhost:3000
```

Autres commandes utiles :

```bash
# Compilation
npm run build

# Démarrage de la version compilée
npm run start:prod

# Tests unitaires
npm run test

# Tests end-to-end
npm run test:e2e
```

### Créer le superadministrateur

Après avoir configuré la base et le fichier `.env`, exécuter :

```bash
npm run seed:superadmin
```

La commande crée le compte par défaut suivant :

```text
Email : admin@gmail.com
Mot de passe : admin 123
```

Elle affiche ces informations dans le terminal après la création. La commande
ne recrée pas un superadministrateur si un compte `superadmin` existe déjà.

Le code du seed se trouve dans
[`Work-Hub-Sofia-Backend/src/seeds/create-superadmin.seed.ts`](./Work-Hub-Sofia-Backend/src/seeds/create-superadmin.seed.ts).
Le mot de passe est haché en base, mais cette valeur par défaut est connue :
changez-la avant toute utilisation en production.

### Seed complet de développement

Pour créer les données de démonstration et leurs relations :

```powershell
cd Work-Hub-Sofia-Backend
npm run seed
```

Le seed complet crée de manière idempotente le superadmin, des départements,
postes, utilisateurs, équipes, plannings, demandes de congé et campagnes.
Les factories se trouvent dans
[`Work-Hub-Sofia-Backend/src/seeds/factories.ts`](./Work-Hub-Sofia-Backend/src/seeds/factories.ts)
et le seed dans
[`Work-Hub-Sofia-Backend/src/seeds/seed-database.ts`](./Work-Hub-Sofia-Backend/src/seeds/seed-database.ts).

## 5. Installer et démarrer le frontend

Ouvrir un **deuxième terminal** à la racine du dépôt :

```bash
cd Work-Hub-Sofia_Frontend
npm install
```

Démarrer Angular :

```bash
npm start
```

L'application sera disponible sur :

```text
http://localhost:4200
```

Le frontend appelle le backend sur `http://localhost:3000`, que le backend soit
lancé directement ou dans Docker.

Autres commandes utiles :

```bash
# Compilation de production
npm run build

# Tests Angular
npm test
```

## Démarrage rapide

Une fois MySQL configuré et les dépendances installées :

**Terminal 1**

```bash
cd Workhub-Sofia/Work-Hub-Sofia-Backend
npm run start:dev
```

**Terminal 2**

```bash
cd Workhub-Sofia/Work-Hub-Sofia_Frontend
npm start
```

Puis ouvrir [http://localhost:4200](http://localhost:4200).

## Problèmes fréquents

### `ECONNREFUSED 127.0.0.1:3306`

MySQL n'est pas démarré ou n'écoute pas sur le port `3306`. Démarrer le
service MySQL et vérifier la configuration dans `src/app.module.ts`.

### `Unknown database 'WorkHubSofia'`

Créer la base avec la commande SQL de la section MySQL.

### `Table doesn't exist`

Le schéma n'a pas encore été installé. Appliquer la migration ou l'export SQL
de la base de développement avant de lancer l'application.

### Erreur CORS

Vérifier que le frontend est ouvert sur `http://localhost:4200` et que le
backend est démarré sur le port `3000`.

### `npm ci` échoue pour le frontend

Le frontend ne contient pas de `package-lock.json` versionné. Utiliser :

```bash
npm install
```

Pour le backend, utiliser de préférence `npm ci`, car son
`package-lock.json` est versionné.

## Structure du dépôt

```text
Workhub-Sofia/
├── Work-Hub-Sofia-Backend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── Work-Hub-Sofia_Frontend/
│   ├── src/
│   ├── angular.json
│   └── package.json
└── README.md
```
