const MemberLevel = require('../database/models/MemberLevel');

/** Formule d'XP requise pour atteindre un niveau donné */
function xpForLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Ajoute de l'XP à un membre, gère le cooldown et le passage de niveau.
 * @returns {Promise<{leveledUp: boolean, newLevel: number, member: object}|null>}
 */
async function addXp(guildId, userId, levelingConfig) {
  const now = Date.now();
  let record = await MemberLevel.findOne({ guildId, userId });

  if (!record) {
    record = new MemberLevel({ guildId, userId });
  }

  const cooldownMs = (levelingConfig.cooldownSeconds || 60) * 1000;
  if (now - record.lastMessageAt < cooldownMs) return null;

  const gained = Math.floor(
    Math.random() * ((levelingConfig.xpMax || 25) - (levelingConfig.xpMin || 15) + 1) + (levelingConfig.xpMin || 15)
  );

  record.xp += gained;
  record.totalXp += gained;
  record.lastMessageAt = now;
  record.messageCount += 1;

  let leveledUp = false;
  let requiredXp = xpForLevel(record.level);

  while (record.xp >= requiredXp) {
    record.xp -= requiredXp;
    record.level += 1;
    leveledUp = true;
    requiredXp = xpForLevel(record.level);
  }

  await record.save();

  return { leveledUp, newLevel: record.level, member: record, gained };
}

module.exports = { addXp, xpForLevel };
