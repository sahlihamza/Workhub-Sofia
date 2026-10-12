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

La configuration actuelle du backend utilise :

| Paramètre | Valeur actuelle |
| --- | --- |
| Hôte | `localhost` |
| Port | `3306` |
| Utilisateur | `root` |
| Mot de passe | vide |
| Base | `WorkHubSofia` |

Ces valeurs sont définies dans
[`Work-Hub-Sofia-Backend/src/app.module.ts`](./Work-Hub-Sofia-Backend/src/app.module.ts).
Si votre installation MySQL utilise un autre utilisateur, un autre mot de passe
ou un autre port, adaptez cette configuration avant de démarrer le backend.

### Schéma de la base

Le backend utilise `synchronize: false`. Il ne crée donc pas automatiquement
les tables au démarrage. Le schéma doit être installé avant le premier
lancement. La migration disponible se trouve dans :

[`Work-Hub-Sofia-Backend/src/migrations/1755178998587-UpdateDatabase.ts`](./Work-Hub-Sofia-Backend/src/migrations/1755178998587-UpdateDatabase.ts)

Cette migration est une migration TypeScript et le projet ne contient pas
encore de commande TypeORM prête à l’exécuter automatiquement. Utilisez le
processus de migration de votre environnement ou un export SQL de la base de
développement, puis vérifiez que les tables suivantes existent :

```text
user
departement
equipe
postes
planning
demande_conge
```

Ne pas utiliser `synchronize: true` sur une base contenant des données sans
validation préalable.

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

# Requis uniquement pour créer un superadministrateur
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=changez-ce-mot-de-passe

# Requis uniquement pour les jours fériés
CALENDARIFIC_API_KEY=votre-cle-api-calendarific

# Optionnel : le backend utilise 3000 par défaut
PORT=3000
```

Les variables suivantes sont utilisées par le code : `JWT_SECRET`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PASSWORD_SECRET`, `FRONTEND_URL`,
`SENDINBLUE_EMAIL`, `SENDINBLUE_API_KEY`, `SUPERADMIN_EMAIL`,
`SUPERADMIN_PASSWORD`, `CALENDARIFIC_API_KEY` et `PORT`.

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

Après avoir configuré la base et le fichier `.env`, exécuter une seule fois :

```bash
npm run seed:superadmin
```

La commande utilise `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` et
`PASSWORD_SECRET`. Elle ne recrée pas un superadministrateur si un compte
`superadmin` existe déjà.

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

Le frontend appelle actuellement le backend sur
`http://localhost:3000`. Il faut donc démarrer les deux serveurs en même
temps.

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
