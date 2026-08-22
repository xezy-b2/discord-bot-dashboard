const Birthday = require('../database/models/Birthday');
const GuildConfig = require('../database/models/GuildConfig');

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // toutes les 15 min, pour respecter l'heure d'envoi choisie avec precision

/** Calcule l'age exact a partir d'une date de naissance (tient compte du mois/jour, pas juste l'annee) */
function calculateAge(birthYear, birthMonth, birthDay) {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const hasHadBirthdayThisYear = (now.getMonth() + 1 > birthMonth) || (now.getMonth() + 1 === birthMonth && now.getDate() >= birthDay);
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Construit le texte de mention : @everyone, @here, ou un vrai rôle <@&id> */
function buildMention(mentionRoleId) {
  if (!mentionRoleId) return '';
  if (mentionRoleId === 'everyone') return '@everyone ';
  if (mentionRoleId === 'here') return '@here ';
  return `<@&${mentionRoleId}> `;
}

async function checkBirthdays(client) {
  const now = new Date();
  const day = now.getUTCDate();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const currentHour = now.getUTCHours();

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

    // Respecte l'heure d'envoi choisie sur le dashboard (en UTC) : on n'annonce que
    // pendant l'heure configuree, pas des que le jour/mois correspond.
    const sendHour = config.birthdays.sendHour ?? 9;
    if (currentHour !== sendHour) continue;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(config.birthdays.channelId);
    if (!channel) continue;

    for (const b of birthdays) {
      const age = b.year ? calculateAge(b.year, b.month, b.day) : null;
      const text = (config.birthdays.message || '🎉 Joyeux anniversaire {user} !')
        .replace('{user}', `<@${b.userId}>`)
        .replace('{age}', age !== null ? String(age) : '');

      const mention = buildMention(config.birthdays.mentionRoleId);
      const payload = {};

      if (config.birthdays.mode === 'embed') {
        const member = await guild.members.fetch(b.userId).catch(() => null);
        const embed = {
          title: config.birthdays.embedTitle || '🎉 Joyeux anniversaire !',
          description: text,
          color: config.birthdays.embedColor ? parseInt(config.birthdays.embedColor.replace('#', ''), 16) : 0xFEE75C
        };
        if (config.birthdays.embedThumbnail && member) {
          embed.thumbnail = { url: member.user.displayAvatarURL({ extension: 'png', size: 256 }) };
        }
        if (config.birthdays.embedImageUrl) {
          embed.image = { url: config.birthdays.embedImageUrl };
        }
        payload.content = mention || undefined;
        payload.embeds = [embed];
      } else {
        payload.content = mention + text;
      }

      channel.send(payload).catch(() => {});

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
