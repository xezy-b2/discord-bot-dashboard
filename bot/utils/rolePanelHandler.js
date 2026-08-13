const GuildConfig = require('../database/models/GuildConfig');

/**
 * Gère le clic sur un bouton de rôle (customId au format "rr_<roleId>").
 */
async function handleRoleButton(interaction) {
  const roleId = interaction.customId.replace('rr_', '');
  const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
  const entry = config?.reactionRoles.find(r => r.messageId === interaction.message.id);
  if (!entry) return interaction.reply({ content: '❌ Ce panneau de rôles n\'est plus configuré.', ephemeral: true });

  const member = interaction.member;
  const hasRole = member.roles.cache.has(roleId);
  const panelRoleIds = entry.pairs.map(p => p.roleId);

  try {
    if (entry.mode === 'unique') {
      if (hasRole) {
        await member.roles.remove(roleId);
        return interaction.reply({ content: `➖ Rôle <@&${roleId}> retiré.`, ephemeral: true });
      }
      // Retire les autres roles du panneau avant d'attribuer le nouveau (mode exclusif)
      const othersToRemove = panelRoleIds.filter(id => id !== roleId && member.roles.cache.has(id));
      if (othersToRemove.length) await member.roles.remove(othersToRemove);
      await member.roles.add(roleId);
      return interaction.reply({ content: `✅ Rôle <@&${roleId}> attribué.`, ephemeral: true });
    }

    // Mode multi : simple bascule
    if (hasRole) {
      await member.roles.remove(roleId);
      return interaction.reply({ content: `➖ Rôle <@&${roleId}> retiré.`, ephemeral: true });
    } else {
      await member.roles.add(roleId);
      return interaction.reply({ content: `✅ Rôle <@&${roleId}> attribué.`, ephemeral: true });
    }
  } catch (err) {
    console.error('[ROLE-PANEL] Erreur bouton :', err);
    interaction.reply({ content: '❌ Impossible de modifier tes rôles (le bot a-t-il un rôle plus haut que celui-ci ?).', ephemeral: true }).catch(() => {});
  }
}

/**
 * Gère une sélection dans le menu déroulant de rôles (customId "rrsel").
 */
async function handleRoleSelect(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
  const entry = config?.reactionRoles.find(r => r.messageId === interaction.message.id);
  if (!entry) return interaction.reply({ content: '❌ Ce panneau de rôles n\'est plus configuré.', ephemeral: true });

  const member = interaction.member;
  const selectedRoleIds = interaction.values; // roles choisis dans le menu
  const panelRoleIds = entry.pairs.map(p => p.roleId);

  // On aligne les roles du membre sur la selection : ajoute ce qui est choisi, retire le reste du panneau
  const toAdd = selectedRoleIds.filter(id => !member.roles.cache.has(id));
  const toRemove = panelRoleIds.filter(id => !selectedRoleIds.includes(id) && member.roles.cache.has(id));

  try {
    if (toAdd.length) await member.roles.add(toAdd);
    if (toRemove.length) await member.roles.remove(toRemove);

    const summary = selectedRoleIds.length
      ? `✅ Rôles mis à jour : ${selectedRoleIds.map(id => `<@&${id}>`).join(' ')}`
      : '➖ Tous les rôles de ce panneau ont été retirés.';
    interaction.reply({ content: summary, ephemeral: true });
  } catch (err) {
    console.error('[ROLE-PANEL] Erreur select :', err);
    interaction.reply({ content: '❌ Impossible de modifier tes rôles (le bot a-t-il un rôle plus haut que ceux-ci ?).', ephemeral: true }).catch(() => {});
  }
}

module.exports = { handleRoleButton, handleRoleSelect };
