const RecurringMessage = require('../database/models/RecurringMessage');

const CHECK_INTERVAL_MS = 60_000; // verifie toutes les minutes (necessaire pour la precision du mode "heure ciblee")

/** Convertit le jour JS (0=dimanche) vers notre convention (0=lundi ... 6=dimanche) */
function toMondayFirstDay(jsDay) {
  return (jsDay + 6) % 7;
}

/** Vrai si l'heure actuelle est dans la plage [start, end) configuree (en UTC) */
function isWithinHourRange(currentHour, start, end) {
  if (start === 0 && end === 24) return true; // plage complete, pas de restriction
  if (start <= end) return currentHour >= start && currentHour < end;
  return currentHour >= start || currentHour < end; // plage qui traverse minuit (ex: 22h -> 6h)
}

async function checkAndSend(client) {
  const now = new Date();
  const currentDay = toMondayFirstDay(now.getUTCDay());
  const currentHour = now.getUTCHours();
  const currentDateStr = now.toISOString().slice(0, 10);

  const messages = await RecurringMessage.find({ enabled: true });

  for (const rm of messages) {
    try {
      const daysOfWeek = rm.daysOfWeek?.length ? rm.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
      if (!daysOfWeek.includes(currentDay)) continue;
      if (!isWithinHourRange(currentHour, rm.sendHourStart ?? 0, rm.sendHourEnd ?? 24)) continue;

      if (rm.mode === 'targetTime') {
        if (rm.lastSentDate === currentDateStr) continue; // deja envoye aujourd'hui
        if (currentHour !== (rm.targetHour ?? 9) || now.getUTCMinutes() !== (rm.targetMinute ?? 0)) continue;

        await sendNow(client, rm);
        rm.lastSentDate = currentDateStr;
        rm.lastSentAt = now;
        await rm.save().catch(() => {});
      } else {
        if (rm.nextSendAt > now) continue;

        await sendNow(client, rm);
        rm.lastSentAt = now;
        rm.nextSendAt = new Date(now.getTime() + rm.intervalMinutes * 60_000);
        await rm.save().catch(() => {});
      }
    } catch (err) {
      console.error(`[RECURRING] Erreur traitement ${rm._id} :`, err.message);
    }
  }
}

async function sendNow(client, rm) {
  const channel = await client.channels.fetch(rm.channelId).catch(() => null);
  if (channel) await channel.send({ content: rm.content }).catch(() => {});
}

function startRecurringMessagesScheduler(client) {
  checkAndSend(client); // premiere verification immediate au demarrage
  setInterval(() => checkAndSend(client), CHECK_INTERVAL_MS);
  console.log('[SCHEDULER] Messages récurrents actifs (vérification chaque minute)');
}

module.exports = { startRecurringMessagesScheduler };
