const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token } = require('./config');
const connectDB = require('./database/connect');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

client.commands = new Collection();

// --- Chargement des commandes ---
const commandsPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(folderPath, file));
    if (command?.data?.name) client.commands.set(command.data.name, command);
  }
}

// --- Chargement des events ---
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// --- Sync automatique du nom de guilde + creation de config par defaut ---
const GuildConfig = require('./database/models/GuildConfig');

client.on('guildCreate', async (guild) => {
  await GuildConfig.findOneAndUpdate(
    { guildId: guild.id },
    { $setOnInsert: { guildId: guild.id, guildName: guild.name } },
    { upsert: true }
  );
});

(async () => {
  await connectDB();
  await client.login(token);

  const { startRecurringMessagesScheduler } = require('./schedulers/recurringMessages');
  const { startBirthdaysScheduler } = require('./schedulers/birthdays');
  const { startSocialNotificationsScheduler } = require('./schedulers/socialNotifications');
  const { startRemindersScheduler } = require('./schedulers/reminders');

  startRecurringMessagesScheduler(client);
  startBirthdaysScheduler(client);
  startSocialNotificationsScheduler(client);
  startRemindersScheduler(client);
})();

process.on('unhandledRejection', (err) => console.error('[UNHANDLED]', err));
