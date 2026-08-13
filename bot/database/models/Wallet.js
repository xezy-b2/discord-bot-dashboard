const { Schema, model } = require('mongoose');

const WalletSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 }
}, { timestamps: true });

WalletSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('Wallet', WalletSchema);
