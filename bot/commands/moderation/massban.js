const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

const MAX_TARGETS = 25; // limite volontaire pour eviter les erreurs de frappe catastrophiques
const ID_REGEX = /<@!?(\d{17,20})>|(\d{17,20})/g;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Bannit plusieurs membres en une seule fois')
    .addStringOption(o => o.setName('membres').setDescription('IDs ou mentions séparés par des espaces (max 25)').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du bannissement (appliquée à tous)'))
    .addIntegerOption(o => o.setName('jours_messages').setDescription('Nombre de jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const raw = interaction.options.getString('membres');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie (bannissement groupé)';
    const days = interaction.options.getInteger('jours_messages') || 0;

    // Extrait tous les IDs (mentions <@id> ou IDs bruts), dedupe
    const ids = [...new Set([...raw.matchAll(ID_REGEX)].map(m => m[1] || m[2]))];

    if (ids.length === 0) {
      return interaction.reply({ content: '❌ Aucun ID ou mention valide trouvé dans la liste fournie.', flags: MessageFlags.Ephemeral });
    }
    if (ids.length > MAX_TARGETS) {
      return interaction.reply({ content: `❌ Trop de membres à la fois (${ids.length}). Limite : ${MAX_TARGETS} par commande.`, flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const success = [];
    const failed = [];

    for (const id of ids) {
      if (id === interaction.user.id) {
        failed.push(`<@${id}> — tu ne peux pas te bannir toi-même`);
        continue;
      }
      if (id === interaction.client.user.id) {
        failed.push(`<@${id}> — impossible de bannir le bot`);
        continue;
      }

      const member = await interaction.guild.members.fetch(id).catch(() => null);
      if (member && !member.bannable) {
        failed.push(`<@${id}> — rôle trop élevé, impossible à bannir`);
        continue;
      }

      try {
        await interaction.guild.members.ban(id, { deleteMessageSeconds: days * 86400, reason });
        success.push(`<@${id}>`);
      } catch (err) {
        failed.push(`<@${id}> — échec (${err.message})`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(failed.length ? '#FEE75C' : '#ED4245')
      .setTitle('🔨 Bannissement groupé')
      .addFields(
        { name: `✅ Bannis (${success.length})`, value: success.length ? success.join(', ') : '—' },
        { name: `❌ Échecs (${failed.length})`, value: failed.length ? failed.join('\n') : '—' },
        { name: 'Raison', value: reason }
      )
      .setFooter({ text: `Par ${interaction.user.tag}` })
      .setTimestamp();

    interaction.editReply({ embeds: [embed] });
  }
};