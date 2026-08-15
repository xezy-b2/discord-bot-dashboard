const {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitField
} = require('discord.js');

// Cache en memoire : cle (timestamp_userId) -> donnees de l'embed en cours d'edition.
// Expire automatiquement apres 10 minutes pour eviter toute fuite memoire.
const embedDataCache = new Map();

// ------------------------------------------------------------------
// Cree le Modal (reutilise pour la creation ET l'edition)
function createEmbedCreatorModal(channelId, initialValues = {}) {
  const modal = new ModalBuilder()
    .setCustomId(`embedCreatorModal_${channelId}`)
    .setTitle('Créateur d\'Embed Avancé');

  const titleInput = new TextInputBuilder()
    .setCustomId('titleInput')
    .setLabel('Titre de l\'embed')
    .setPlaceholder('Quel titre souhaitez-vous donner à votre embed ? (Optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(256)
    .setValue(initialValues.title || '');

  const descriptionInput = new TextInputBuilder()
    .setCustomId('descriptionInput')
    .setLabel('Description de l\'embed')
    .setPlaceholder('Quelle description souhaitez-vous donner à votre embed ? (Obligatoire)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000)
    .setValue(initialValues.description || '');

  const footerInput = new TextInputBuilder()
    .setCustomId('footerInput')
    .setLabel('Footer de l\'embed')
    .setPlaceholder('Texte de pied de page (Optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(2048)
    .setValue(initialValues.footerText || '');

  const colorInput = new TextInputBuilder()
    .setCustomId('colorInput')
    .setLabel('Couleur de l\'embed (ex: #FF0000)')
    .setPlaceholder('Laisser vide pour la couleur par défaut (Optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(7)
    .setValue(initialValues.colorOption || '');

  const imageInput = new TextInputBuilder()
    .setCustomId('imageInput')
    .setLabel('Image principale (URL)')
    .setPlaceholder('Lien vers l\'image principale (Optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(initialValues.imageUrl || '');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(imageInput)
  );
  return modal;
}

// ------------------------------------------------------------------
// Convertit les champs soumis en Embed + donnees serialisees (pour le cache)
function createEmbedAndData(interaction) {
  const channelId = interaction.customId.split('_')[1];

  const title = interaction.fields.getTextInputValue('titleInput') || '';
  const description = interaction.fields.getTextInputValue('descriptionInput') || '';
  const footerText = interaction.fields.getTextInputValue('footerInput') || '';
  const colorOption = interaction.fields.getTextInputValue('colorInput') || '';
  const imageUrl = interaction.fields.getTextInputValue('imageInput') || '';

  let color = 0x0099ff;
  let colorHex = colorOption;

  if (colorOption) {
    const hexMatch = colorOption.match(/^#?([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      color = parseInt(hexMatch[1], 16);
      colorHex = `#${hexMatch[1].toUpperCase()}`;
    } else {
      colorHex = '';
      color = 0x0099ff;
    }
  }

  if (!description) {
    throw new Error('La description est obligatoire.');
  }

  const embed = new EmbedBuilder()
    .setDescription(description)
    .setColor(color);

  if (title) embed.setTitle(title);
  if (footerText) embed.setFooter({ text: footerText });
  if (imageUrl) embed.setImage(imageUrl);

  return {
    embed,
    data: {
      c: channelId,
      t: title,
      d: description,
      f: footerText,
      x: colorHex,
      i: imageUrl
    }
  };
}

// ------------------------------------------------------------------
// Traite la soumission du modal : genere l'apercu + boutons Modifier/Envoyer
async function handleEmbedCreatorModalSubmit(interaction) {
  try {
    const { embed, data } = createEmbedAndData(interaction);
    const userId = interaction.user.id;

    const cacheKey = `${Date.now()}_${userId}`;
    embedDataCache.set(cacheKey, data);

    setTimeout(() => {
      embedDataCache.delete(cacheKey);
    }, 10 * 60 * 1000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`embed-edit-preview_${cacheKey}`)
        .setLabel('Modifier')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId(`embed-send-preview_${cacheKey}`)
        .setLabel('Envoyer Définitivement')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🚀')
    );

    const previewContent = `**Aperçu de l'Embed pour le canal <#${data.c}> :**\n*(Ce message et les données de modification expireront dans 10 minutes.)*`;

    await interaction.reply({
      content: previewContent,
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (err) {
    console.error('[EMBED-CREATOR] Erreur lors de la création de l\'aperçu :', err);

    const errorContent = err.message.includes('description')
      ? '❌ La description de l\'embed est obligatoire.'
      : '❌ Une erreur est survenue lors de la création de l\'aperçu.';

    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ ephemeral: true, content: errorContent });
    } else {
      await interaction.editReply({ ephemeral: true, content: errorContent });
    }
  }
}

// ------------------------------------------------------------------
// Gere les clics sur les boutons Modifier / Envoyer
async function handleEmbedCreatorButtonInteraction(interaction) {
  const [action, cacheKey] = interaction.customId.split(/_(.+)/);

  if (!cacheKey) {
    return interaction.reply({ ephemeral: true, content: '❌ Erreur de données : la clé de cache est manquante. Relance la commande `/embed-modal`.' });
  }

  const data = embedDataCache.get(cacheKey);
  if (!data) {
    return interaction.reply({ ephemeral: true, content: '❌ Les données de l\'embed ont expiré ou sont introuvables. Relance la commande `/embed-modal`.' });
  }

  const userIdFromCacheKey = cacheKey.split('_').pop();
  if (interaction.user.id !== userIdFromCacheKey) {
    return interaction.reply({ ephemeral: true, content: '❌ Seul l\'auteur de la commande peut interagir avec ces boutons.' });
  }

  // --- Modifier : ouvre a nouveau le modal, pre-rempli ---
  if (action === 'embed-edit-preview') {
    try {
      const modal = createEmbedCreatorModal(data.c, {
        title: data.t, description: data.d, footerText: data.f, colorOption: data.x, imageUrl: data.i
      });
      await interaction.showModal(modal);
      return;
    } catch (err) {
      console.error('[EMBED-CREATOR] Erreur ouverture modal d\'édition :', err);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ ephemeral: true, content: '❌ Une erreur est survenue lors de l\'ouverture du formulaire d\'édition.' });
      }
    }
  }

  // --- Envoyer : poste l'embed final dans le salon cible ---
  if (action === 'embed-send-preview') {
    try {
      await interaction.deferUpdate();
    } catch (err) {
      console.error('[EMBED-CREATOR] Échec du defer immédiat :', err.message);
      return;
    }

    try {
      const targetChannel = interaction.guild.channels.cache.get(data.c);
      if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
        embedDataCache.delete(cacheKey);
        return interaction.editReply({ content: '❌ Salon de destination introuvable ou invalide.', components: [] });
      }

      let color = 0x0099ff;
      if (data.x) {
        try { color = parseInt(data.x.replace('#', ''), 16); } catch (e) { /* ignore */ }
      }

      const embedToSend = new EmbedBuilder().setDescription(data.d).setColor(color);
      if (data.t) embedToSend.setTitle(data.t);
      if (data.f) embedToSend.setFooter({ text: data.f });
      if (data.i) embedToSend.setImage(data.i);

      const botPermissions = targetChannel.permissionsFor(interaction.client.user);
      if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
        embedDataCache.delete(cacheKey);
        return interaction.editReply({ content: `❌ Le bot n'a pas la permission d'envoyer des messages ou des embeds dans ${targetChannel}.`, components: [] });
      }

      await targetChannel.send({ embeds: [embedToSend] });
      embedDataCache.delete(cacheKey);

      await interaction.editReply({
        content: `✅ Embed envoyé avec succès dans ${targetChannel} !`,
        embeds: [embedToSend],
        components: []
      });
    } catch (err) {
      console.error('[EMBED-CREATOR] Erreur lors de l\'envoi :', err);
      embedDataCache.delete(cacheKey);
      await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'envoi de l\'embed.', components: [] }).catch(() => {});
    }
  }
}

module.exports = { createEmbedCreatorModal, handleEmbedCreatorModalSubmit, handleEmbedCreatorButtonInteraction };
