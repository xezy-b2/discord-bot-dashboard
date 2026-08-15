const Reminder = require('../database/models/Reminder');

const CHECK_INTERVAL_MS = 30_000; // toutes les 30 secondes, assez precis pour un rappel

async function checkReminders(client) {
  const due = await Reminder.find({ remindAt: { $lte: new Date() } });

  for (const reminder of due) {
    try {
      const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
      const text = `⏰ <@${reminder.userId}> Rappel : ${reminder.message}`;

      if (channel) {
        await channel.send(text).catch(async () => {
          // Si le bot n'a plus acces au salon (supprime, permissions...), tente un DM en secours
          const user = await client.users.fetch(reminder.userId).catch(() => null);
          user?.send(text).catch(() => {});
        });
      } else {
        const user = await client.users.fetch(reminder.userId).catch(() => null);
        user?.send(text).catch(() => {});
      }
    } catch (err) {
      console.error(`[REMINDERS] Erreur envoi rappel ${reminder._id} :`, err.message);
    } finally {
      await Reminder.deleteOne({ _id: reminder._id }).catch(() => {});
    }
  }
}

function startRemindersScheduler(client) {
  checkReminders(client);
  setInterval(() => checkReminders(client), CHECK_INTERVAL_MS);
  console.log('[SCHEDULER] Rappels personnels actifs (vérification toutes les 30s)');
}

module.exports = { startRemindersScheduler };
