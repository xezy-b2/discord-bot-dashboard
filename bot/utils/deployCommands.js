const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, clientId } = require('../config');

function loadCommandData() {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(folderPath, file));
      if (command?.data) commands.push(command.data.toJSON());
    }
  }
  return commands;
}

(async () => {
  try {
    const commands = loadCommandData();
    const rest = new REST().setToken(token);

    console.log(`[DEPLOY] Enregistrement de ${commands.length} commande(s)...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('[DEPLOY] Commandes enregistrées avec succès.');
  } catch (err) {
    console.error('[DEPLOY] Erreur :', err);
  }
})();
