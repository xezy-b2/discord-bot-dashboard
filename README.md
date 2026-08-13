# Discord Bot + Dashboard (style DraftBot / MEE6)

Bot Discord complet (Node.js + discord.js v14 + MongoDB) avec dashboard web (React + Express) permettant de tout configurer visuellement, avec **aperçu en direct** des cartes de bienvenue/départ.

## Fonctionnalités

**Bot**
- 👋 Bienvenue / 🚪 Départ : carte image générée dynamiquement (avatar, dégradé, couleurs, texte) et/ou embed, message privé optionnel
- 🛡️ Auto-modération : anti-invite, anti-lien, anti-spam, anti-caps, mots bannis, anti mention-spam
- 🔨 Modération : `/kick` `/ban` `/mute` `/warn` `/clear`, historique des avertissements
- 📈 Système de niveaux/XP avec cooldown configurable, `/rank` (carte visuelle), `/leaderboard`, récompenses de rôles par niveau
- 🪙 Économie basique (monnaie virtuelle, prête à étendre avec `/daily` `/work`)
- ⚡ Commandes personnalisées (préfixe configurable)
- 📜 Logs d'évènements (configurable par type)
- 🎭 Reaction roles (structure DB prête, à brancher sur les commandes si besoin)

**Dashboard**
- Connexion réelle via OAuth2 Discord (JWT en cookie httpOnly)
- Liste des serveurs où l'utilisateur a les droits `MANAGE_GUILD`
- Éditeur bienvenue/départ avec **aperçu en direct** (même moteur de rendu canvas que le bot → rendu identique)
- Rôles à réaction : panneaux **réactions / boutons / menu déroulant**, mode multi ou exclusif
- 🎫 **Tickets** : panneau avec bouton, création de salon privé, transcription **HTML** façon Discord générée à la fermeture
- 🔁 **Messages récurrents** : programmés à intervalle régulier
- 🎂 **Anniversaires** : commandes `/anniversaire definir|retirer|liste` + config et vue d'ensemble sur le dashboard
- 📡 **Notifications sociales** : Twitch (live), YouTube (nouvelle vidéo), TikTok (best-effort), Epic Games (jeux gratuits), Steam (actus d'un jeu)
- Pages : auto-modération, sanctions, niveaux & XP (+ classement), économie, commandes custom, logs, paramètres généraux
- Design sombre distinctif (Tailwind, palette violet/ambre, typographie Space Grotesk + Inter)

## Architecture

```
discord-bot-dashboard/
├── bot/                  # Le bot Discord (process indépendant)
│   ├── commands/         # Slash commands (modération, leveling, utilitaires)
│   ├── events/           # Handlers d'évènements Discord
│   ├── database/models/  # Schémas Mongoose
│   ├── utils/             # Génération d'image, leveling, automod
│   └── index.js
│
└── dashboard/
    ├── backend/          # API REST (Express) + OAuth2 Discord
    │   ├── routes/
    │   ├── models/       # Mêmes schémas Mongoose (même DB que le bot)
    │   └── server.js
    └── frontend/         # Interface React (Vite + Tailwind)
        └── src/
```

Le bot et le dashboard sont **deux process Node séparés** qui partagent la même base MongoDB. Le dashboard backend appelle l'API REST Discord directement (avec le token du bot) pour lister les salons/rôles, et régénère les cartes de bienvenue/départ avec la même fonction que le bot pour garantir un aperçu fidèle à 100%.

## Installation

### Prérequis
- Node.js 18+
- Une instance MongoDB (locale ou Atlas)
- Une application Discord créée sur https://discord.com/developers/applications
  - Récupère le **Client ID**, le **Client Secret**, et crée un **Bot** pour avoir son **Token**
  - Dans l'onglet OAuth2, ajoute l'URL de redirection : `http://localhost:4000/api/auth/discord/callback`
  - Invite le bot sur ton serveur avec les scopes `bot` + `applications.commands` et les permissions nécessaires (Administrateur en test, sinon affine)

### 1. Le bot

```bash
cd bot
cp .env.example .env
# Remplis DISCORD_TOKEN, CLIENT_ID, MONGO_URI dans .env
npm install
npm run deploy   # enregistre les slash commands sur Discord
npm start
```

### 2. Le backend du dashboard

```bash
cd dashboard/backend
cp .env.example .env
# Remplis les variables (mêmes CLIENT_ID/BOT_TOKEN que le bot + CLIENT_SECRET)
npm install
npm start
```

### 3. Le frontend du dashboard

```bash
cd dashboard/frontend
cp .env.example .env
npm install
npm run dev
```

Ouvre `http://localhost:5173`, connecte-toi avec Discord, choisis un serveur, et configure ton bot avec l'aperçu en direct.

## Polices (optionnel)

Pour un rendu de carte identique aux maquettes, place `Poppins-Bold.ttf` et `Poppins-Regular.ttf` (gratuites sur Google Fonts) dans `bot/assets/fonts/` **et** `dashboard/backend/assets/fonts/`. Sans elles, le rendu retombe automatiquement sur une police système.

## Notifications sociales — clés API nécessaires

- **Twitch** : crée une app sur https://dev.twitch.tv/console/apps, récupère `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET`, mets-les dans `bot/.env`
- **YouTube** : active "YouTube Data API v3" sur https://console.cloud.google.com, crée une clé API, mets-la dans `YOUTUBE_API_KEY`
- **Epic Games** et **Steam** : aucune clé nécessaire (APIs publiques)
- **TikTok** : ⚠️ TikTok ne propose **aucune API officielle gratuite** pour ça. L'implémentation scrape la page publique du profil — c'est fonctionnel mais fragile par nature (peut casser si TikTok change sa page). À utiliser en connaissance de cause.

## Pistes d'extension

- `/daily` `/work` `/balance` `/shop` pour compléter l'économie (le schéma `Wallet` est prêt)
- Notifications en direct dans le dashboard (WebSocket) plutôt que polling
- Multi-langue (i18n) sur le frontend
- Giveaways, modération vocale, statistiques de serveur avancées
