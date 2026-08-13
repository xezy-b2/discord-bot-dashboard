require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const guildsRoutes = require('./routes/guilds');
const configRoutes = require('./routes/config');
const previewRoutes = require('./routes/preview');
const moderationRoutes = require('./routes/moderation');
const levelingRoutes = require('./routes/leveling');
const reactionRolesRoutes = require('./routes/reactionRoles');
const ticketsRoutes = require('./routes/tickets');
const recurringMessagesRoutes = require('./routes/recurringMessages');
const birthdaysRoutes = require('./routes/birthdays');
const socialNotificationsRoutes = require('./routes/socialNotifications');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/leveling', levelingRoutes);
app.use('/api/reaction-roles', reactionRolesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/recurring-messages', recurringMessagesRoutes);
app.use('/api/birthdays', birthdaysRoutes);
app.use('/api/social-notifications', socialNotificationsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Déploiement mono-domaine (recommandé) ---
// Si le frontend a été buildé (dashboard/frontend/dist existe), le backend le sert directement.
// Frontend et backend deviennent alors la MÊME origine : plus besoin de proxy, de CORS complexe,
// ni de CROSS_SITE_COOKIES. C'est le mode à utiliser pour héberger tout sur une seule plateforme
// (Railway, Render, VPS...). En développement local, ce dossier n'existe pas encore : le frontend
// tourne séparément via "npm run dev" (Vite) avec son proxy, donc rien ne change pour toi en local.
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log('[SERVER] Frontend détecté et servi depuis /dashboard/frontend/dist');
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[DB] Connecté à MongoDB');
    app.listen(process.env.PORT || 4000, () => {
      console.log(`[SERVER] Dashboard backend lancé sur le port ${process.env.PORT || 4000}`);
    });
  })
  .catch(err => {
    console.error('[DB] Erreur de connexion :', err);
    process.exit(1);
  });