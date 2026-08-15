const { Schema, model } = require('mongoose');

const AfkSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  reason: { type: String, default: 'Absent' },
  since: { type: Date, default: Date.now },
  originalNickname: { type: String, default: null } // pour restaurer le pseudo au retour
}, { timestamps: true });

AfkSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('Afk', AfkSchema);
