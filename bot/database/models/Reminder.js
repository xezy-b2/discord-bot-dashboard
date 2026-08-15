const { Schema, model } = require('mongoose');

const ReminderSchema = new Schema({
  userId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  message: { type: String, default: '' },
  remindAt: { type: Date, required: true, index: true }
}, { timestamps: true });

module.exports = model('Reminder', ReminderSchema);
