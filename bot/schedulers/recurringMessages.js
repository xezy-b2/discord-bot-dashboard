const RecurringMessage = require('../database/models/RecurringMessage');

const CHECK_INTERVAL_MS = 60_000; // verifie toutes les minutes

async function checkAndSend(client) {
  const now = new Date();
  const due = await RecurringMessage.find({ enabled: true, nextSendAt: { $lte: now } });

  for (const rm of due) {
    try {
      const channel = await client.channels.fetch(rm.channelId).catch(() => null);
      if (channel) {
        await channel.send({ content: rm.content });
      }
    } catch (err) {
      console.error(`[RECURRING] Erreur envoi message ${rm._id} :`, err.message);
    } finally {
      rm.lastSentAt = now;
      rm.nextSendAt = new Date(now.getTime() + rm.intervalMinutes * 60_000);
      await rm.save().catch(() => {});
    }
  }
}

function startRecurringMessagesScheduler(client) {
  checkAndSend(client); // premiere verification immediate au demarrage
  setInterval(() => checkAndSend(client), CHECK_INTERVAL_MS);
  console.log('[SCHEDULER] Messages récurrents actifs (vérification chaque minute)');
}

module.exports = { startRecurringMessagesScheduler };
