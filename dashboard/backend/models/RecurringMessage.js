const { Schema, model } = require('mongoose');

const RecurringMessageSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  name: { type: String, default: '', maxlength: 30 },
  channelId: { type: String, required: true },
  content: { type: String, required: true },
  enabled: { type: Boolean, default: true },

  mode: { type: String, enum: ['interval', 'targetTime'], default: 'interval' },

  // Mode "Répétition"
  intervalMinutes: { type: Number, default: 60, min: 5 }, // minimum 5 min pour eviter le spam
  nextSendAt: { type: Date, default: () => new Date() },

  // Mode "Heure ciblée" (envoi une fois par jour a une heure precise, en UTC)
  targetHour: { type: Number, default: 9, min: 0, max: 23 },
  targetMinute: { type: Number, default: 0, min: 0, max: 59 },
  lastSentDate: { type: String, default: null }, // 'YYYY-MM-DD' (UTC), evite un double envoi le meme jour

  // Contraintes communes aux deux modes
  sendHourStart: { type: Number, default: 0, min: 0, max: 24 }, // debut de la plage horaire autorisee (UTC)
  sendHourEnd: { type: Number, default: 24, min: 0, max: 24 }, // fin de la plage horaire autorisee (UTC)
  daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0 = Lundi ... 6 = Dimanche

  lastSentAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = model('RecurringMessage', RecurringMessageSchema);
