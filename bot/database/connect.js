const mongoose = require('mongoose');
const { mongoUri } = require('../config');

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log('[DB] Connecté à MongoDB');
  } catch (err) {
    console.error('[DB] Erreur de connexion MongoDB :', err);
    process.exit(1);
  }
}

module.exports = connectDB;
