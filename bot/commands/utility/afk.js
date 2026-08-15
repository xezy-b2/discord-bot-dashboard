const { SlashCommandBuilder } = require('discord.js');
const Afk = require('../../database/models/Afk');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Passe en statut absent (AFK)')
    .addStringOption(o => o.setName('raison').setDescription('Raison de ton absence')),

  async execute(interaction) {
    const reason = interaction.options.getString('raison') || 'Absent';
    const member = interaction.member;
    const originalNickname = member.nickname; // null si pas de pseudo custom

    await Afk.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: interaction.user.id },
      { reason, since: new Date(), originalNickname },
      { upsert: true }
    );

    // Prefixe le pseudo, best-effort (peut echouer si le bot n'a pas la permission sur ce membre)
    const currentName = member.nickname || member.user.username;
    if (!currentName.startsWith('[AFK] ')) {
      member.setNickname(`[AFK] ${currentName}`.slice(0, 32)).catch(() => {});
    }

    interaction.reply(`💤 Tu es maintenant AFK : *${reason}*`);
  }
};
