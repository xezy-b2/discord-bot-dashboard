const { Schema, model } = require('mongoose');

const RecurringMessageSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  content: { type: String, required: true },
  intervalMinutes: { type: Number, required: true, min: 5 }, // minimum 5 min pour eviter le spam
  enabled: { type: Boolean, default: true },
  lastSentAt: { type: Date, default: null },
  nextSendAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = model('RecurringMessage', RecurringMessageSchema);
