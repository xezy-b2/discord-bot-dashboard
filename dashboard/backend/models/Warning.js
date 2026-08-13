const { Schema, model } = require('mongoose');

const WarningSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'Aucune raison fournie' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Warning', WarningSchema);
