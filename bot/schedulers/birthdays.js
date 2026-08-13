const Birthday = require('../database/models/Birthday');
const GuildConfig = require('../database/models/GuildConfig');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // verifie toutes les heures (suffisant, pas besoin de la seconde pres)

async function checkBirthdays(client) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const todaysBirthdays = await Birthday.find({ day, month, lastAnnouncedYear: { $ne: year } });
  if (!todaysBirthdays.length) return;

  // Regroupe par serveur pour ne charger la config qu'une fois par guilde
  const byGuild = {};
  for (const b of todaysBirthdays) {
    (byGuild[b.guildId] ||= []).push(b);
  }

  for (const [guildId, birthdays] of Object.entries(byGuild)) {
    const config = await GuildConfig.findOne({ guildId });
    if (!config?.birthdays?.enabled || !config.birthdays.channelId) continue;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(config.birthdays.channelId);
    if (!channel) continue;

    for (const b of birthdays) {
      const age = b.year ? year - b.year : null;
      const text = (config.birthdays.message || '🎉 Joyeux anniversaire {user} !')
        .replace('{user}', `<@${b.userId}>`)
        .replace('{age}', age !== null ? String(age) : '');

      channel.send(text).catch(() => {});

      if (config.birthdays.roleId) {
        const member = await guild.members.fetch(b.userId).catch(() => null);
        member?.roles.add(config.birthdays.roleId).catch(() => {});
        // Retire le role le lendemain
        setTimeout(() => member?.roles.remove(config.birthdays.roleId).catch(() => {}), 24 * 60 * 60 * 1000);
      }

      b.lastAnnouncedYear = year;
      await b.save().catch(() => {});
    }
  }
}

function startBirthdaysScheduler(client) {
  checkBirthdays(client);
  setInterval(() => checkBirthdays(client), CHECK_INTERVAL_MS);
  console.log('[SCHEDULER] Anniversaires actifs (vérification chaque heure)');
}

module.exports = { startBirthdaysScheduler };
