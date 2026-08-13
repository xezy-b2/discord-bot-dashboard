require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  mongoUri: process.env.MONGO_URI,

  // Couleurs par defaut utilisees un peu partout (embeds, cartes)
  colors: {
    primary: '#5865F2',
    success: '#57F287',
    danger: '#ED4245',
    warning: '#FEE75C'
  },

  // Formule XP par defaut (modifiable par serveur depuis le dashboard)
  defaultLeveling: {
    xpPerMessage: { min: 15, max: 25 },
    cooldownSeconds: 60,
    xpFormula: (level) => 5 * (level ** 2) + 50 * level + 100
  }
};
