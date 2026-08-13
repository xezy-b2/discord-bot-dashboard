const { Schema, model } = require('mongoose');

const MemberLevelSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  lastMessageAt: { type: Number, default: 0 }, // timestamp ms, pour le cooldown XP
  messageCount: { type: Number, default: 0 }
}, { timestamps: true });

MemberLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('MemberLevel', MemberLevelSchema);
