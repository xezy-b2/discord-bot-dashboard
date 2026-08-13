const { handleRoleButton, handleRoleSelect } = require('../utils/rolePanelHandler');
const { handleTicketCreate, handleTicketClaim, handleTicketClose } = require('../utils/ticketHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[CMD] Erreur sur /${interaction.commandName} :`, err);
        const payload = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('rr_')) return handleRoleButton(interaction);
      if (interaction.customId === 'ticket_create') return handleTicketCreate(interaction);
      if (interaction.customId === 'ticket_claim') return handleTicketClaim(interaction);
      if (interaction.customId === 'ticket_close') return handleTicketClose(interaction);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'rrsel') {
      return handleRoleSelect(interaction);
    }
  }
};
