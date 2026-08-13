const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');
const Ticket = require('../database/models/Ticket');
const { generateTranscript } = require('./ticketTranscript');

function ticketControlsRow(claimed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel(claimed ? 'Réclamé' : 'Réclamer').setEmoji('🙋').setStyle(ButtonStyle.Secondary).setDisabled(claimed),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger)
  );
}

async function handleTicketCreate(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
  const cfg = config?.tickets;
  if (!cfg?.enabled) return interaction.reply({ content: '❌ Le système de tickets n\'est pas activé sur ce serveur.', ephemeral: true });

  const openCount = await Ticket.countDocuments({ guildId: interaction.guild.id, userId: interaction.user.id, status: 'open' });
  if (openCount >= (cfg.maxOpenPerUser || 1)) {
    return interaction.reply({ content: `❌ Tu as déjà ${openCount} ticket(s) ouvert(s). Ferme-en un avant d'en créer un nouveau.`, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
  ];
  for (const roleId of cfg.supportRoleIds || []) {
    overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: cfg.categoryId || undefined,
    permissionOverwrites: overwrites
  });

  await Ticket.create({ guildId: interaction.guild.id, channelId: channel.id, userId: interaction.user.id });

  const supportMentions = (cfg.supportRoleIds || []).map(id => `<@&${id}>`).join(' ');
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🎫 Nouveau ticket')
    .setDescription((cfg.welcomeMessage || '').replace('{user}', `${interaction.user}`))
    .setTimestamp();

  await channel.send({ content: `${interaction.user} ${supportMentions}`, embeds: [embed], components: [ticketControlsRow(false)] });

  interaction.editReply({ content: `✅ Ticket créé : ${channel}` });
}

async function handleTicketClaim(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', ephemeral: true });

  ticket.claimedBy = interaction.user.id;
  await ticket.save();

  await interaction.reply({ content: `🙋 Ticket réclamé par ${interaction.user}.` });

  const message = await interaction.channel.messages.fetch(interaction.message.id);
  await message.edit({ components: [ticketControlsRow(true)] }).catch(() => {});
}

async function handleTicketClose(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket introuvable.', ephemeral: true });

  await interaction.reply({ content: '🔒 Fermeture du ticket et génération de la transcription...' });

  try {
    const html = await generateTranscript(interaction.channel);
    const transcriptChannelId = config?.tickets?.transcriptChannelId;

    if (transcriptChannelId) {
      const transcriptChannel = interaction.guild.channels.cache.get(transcriptChannelId);
      if (transcriptChannel) {
        const buffer = Buffer.from(html, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.html` });
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📄 Ticket fermé')
          .addFields(
            { name: 'Salon', value: `#${interaction.channel.name}`, inline: true },
            { name: 'Ouvert par', value: `<@${ticket.userId}>`, inline: true },
            { name: 'Fermé par', value: `${interaction.user}`, inline: true }
          )
          .setTimestamp();
        await transcriptChannel.send({ embeds: [embed], files: [attachment] });
      }
    }
  } catch (err) {
    console.error('[TICKETS] Erreur génération transcription :', err);
  }

  ticket.status = 'closed';
  ticket.closedBy = interaction.user.id;
  ticket.closedAt = new Date();
  await ticket.save();

  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

module.exports = { handleTicketCreate, handleTicketClaim, handleTicketClose };
