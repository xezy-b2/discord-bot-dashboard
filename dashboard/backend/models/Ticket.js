const { Schema, model } = require('mongoose');

const TicketSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  claimedBy: { type: String, default: null },
  closedBy: { type: String, default: null },
  closedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = model('Ticket', TicketSchema);
