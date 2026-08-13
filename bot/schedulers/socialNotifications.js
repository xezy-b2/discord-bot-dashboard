const { EmbedBuilder } = require('discord.js');
const SocialAccount = require('../database/models/SocialAccount');
const { checkTwitch } = require('../utils/socialPollers/twitch');
const { checkYoutube } = require('../utils/socialPollers/youtube');
const { checkTiktok } = require('../utils/socialPollers/tiktok');
const { checkEpicGames } = require('../utils/socialPollers/epicgames');
const { checkSteamFreeGames } = require('../utils/socialPollers/steam');

const CHECK_INTERVAL_MS = 5 * 60_000; // toutes les 5 minutes (raisonnable pour eviter le rate limit des APIs)

async function notify(client, account, embed) {
  const channel = await client.channels.fetch(account.channelId).catch(() => null);
  if (!channel) return;
  const content = account.message ? account.message : undefined;
  channel.send({ content, embeds: [embed] }).catch(() => {});
}

async function processTwitch(client, account) {
  const result = await checkTwitch(account.identifier);
  const wasLive = account.lastState?.isLive;

  if (!wasLive && result.isLive && account.lastState !== null) {
    const embed = new EmbedBuilder()
      .setColor('#9146FF')
      .setTitle(`🔴 ${account.displayName || account.identifier} est en live !`)
      .setDescription(result.title || '')
      .addFields({ name: 'Jeu', value: result.gameName || 'Inconnu' })
      .setURL(result.url)
      .setImage(result.thumbnailUrl ? `${result.thumbnailUrl}?t=${Date.now()}` : null)
      .setTimestamp();
    await notify(client, account, embed);
  }

  account.lastState = { isLive: result.isLive };
}

async function processYoutube(client, account) {
  const result = await checkYoutube(account.identifier);
  if (!result) return;

  const isFirstCheck = account.lastState === null;
  if (!isFirstCheck && account.lastState?.videoId !== result.videoId) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`📺 Nouvelle vidéo de ${account.displayName || account.identifier}`)
      .setDescription(result.title)
      .setURL(result.url)
      .setImage(result.thumbnailUrl || null)
      .setTimestamp();
    await notify(client, account, embed);
  }

  account.lastState = { videoId: result.videoId };
}

async function processTiktok(client, account) {
  const result = await checkTiktok(account.identifier);
  if (!result) return;

  const isFirstCheck = account.lastState === null;
  if (!isFirstCheck && account.lastState?.videoId !== result.videoId) {
    const embed = new EmbedBuilder()
      .setColor('#000000')
      .setTitle(`🎵 Nouvelle vidéo TikTok de ${account.displayName || account.identifier}`)
      .setURL(result.url)
      .setTimestamp();
    await notify(client, account, embed);
  }

  account.lastState = { videoId: result.videoId };
}

async function processEpicGames(client, account) {
  const result = await checkEpicGames();
  const isFirstCheck = account.lastState === null;
  const previousTitles = account.lastState?.titles || [];
  const currentTitles = result.freeGames.map(g => g.title);
  const newGames = result.freeGames.filter(g => !previousTitles.includes(g.title));

  if (!isFirstCheck && newGames.length > 0) {
    for (const game of newGames) {
      const embed = new EmbedBuilder()
        .setColor('#313131')
        .setTitle(`🎮 Jeu gratuit sur Epic Games : ${game.title}`)
        .setURL(game.url)
        .setImage(game.imageUrl || null)
        .setTimestamp();
      await notify(client, account, embed);
    }
  }

  account.lastState = { titles: currentTitles };
}

async function processSteam(client, account) {
  const result = await checkSteamFreeGames();
  const isFirstCheck = account.lastState === null;
  const previousTitles = account.lastState?.titles || [];
  const newGames = result.freeGames.filter(g => !previousTitles.includes(g.title));

  if (!isFirstCheck && newGames.length > 0) {
    for (const game of newGames) {
      const embed = new EmbedBuilder()
        .setColor('#1b2838')
        .setTitle(`🎮 Jeu gratuit sur Steam : ${game.title}`)
        .setURL(game.url)
        .setImage(game.imageUrl || null)
        .setTimestamp();
      await notify(client, account, embed);
    }
  }

  account.lastState = { titles: result.freeGames.map(g => g.title) };
}

const PROCESSORS = {
  twitch: processTwitch,
  youtube: processYoutube,
  tiktok: processTiktok,
  epicgames: processEpicGames,
  steam: processSteam
};

async function checkAll(client) {
  const accounts = await SocialAccount.find({ enabled: true });

  for (const account of accounts) {
    try {
      const processor = PROCESSORS[account.platform];
      if (!processor) continue;
      await processor(client, account);
      account.lastCheckedAt = new Date();
      await account.save();
    } catch (err) {
      console.error(`[SOCIAL] Erreur vérification ${account.platform}/${account.identifier} :`, err.message);
    }
  }
}

function startSocialNotificationsScheduler(client) {
  checkAll(client);
  setInterval(() => checkAll(client), CHECK_INTERVAL_MS);
  console.log('[SCHEDULER] Notifications sociales actives (vérification toutes les 5 min)');
}

module.exports = { startSocialNotificationsScheduler };