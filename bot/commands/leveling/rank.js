const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const MemberLevel = require('../../database/models/MemberLevel');
const GuildConfig = require('../../database/models/GuildConfig');
const { xpForLevel } = require('../../utils/levelSystem');
const { generateRankCard } = require('../../utils/generateRankCard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ta carte de niveau (ou celle d\'un autre membre)')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter')),

  async execute(interaction) {
    const user = interaction.options.getUser('membre') || interaction.user;
    await interaction.deferReply();

    const record = await MemberLevel.findOne({ guildId: interaction.guild.id, userId: user.id });
    if (!record) return interaction.editReply(`${user.username} n'a pas encore d'XP sur ce serveur.`);

    const rank = await MemberLevel.countDocuments({
      guildId: interaction.guild.id,
      totalXp: { $gt: record.totalXp }
    }) + 1;

    const requiredXp = xpForLevel(record.level);
    const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const cfg = config?.leveling?.rankCard || {};

    const buffer = await generateRankCard(cfg, {
      username: user.username,
      avatarUrl: user.displayAvatarURL({ extension: 'png', size: 256 }),
      rank,
      level: record.level,
      xp: record.xp,
      requiredXp
    });

    interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: 'rank.png' })] });
  }
};
