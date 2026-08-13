const { Schema, model } = require('mongoose');

const BirthdaySchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  day: { type: Number, required: true, min: 1, max: 31 },
  month: { type: Number, required: true, min: 1, max: 12 }, // 1 = janvier
  year: { type: Number, default: null }, // optionnel, pour afficher l'age
  lastAnnouncedYear: { type: Number, default: null } // evite de souhaiter 2x le meme jour
}, { timestamps: true });

BirthdaySchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('Birthday', BirthdaySchema);
