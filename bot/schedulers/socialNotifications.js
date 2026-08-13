const { EmbedBuilder } = require('discord.js');
const SocialAccount = require('../database/models/SocialAccount');
const { checkTwitch } = require('../utils/socialPollers/twitch');
const { checkYoutube } = require('../utils/socialPollers/youtube');
const { checkTiktok } = require('../utils/socialPollers/tiktok');
const { checkEpicGames } = require('../utils/socialPollers/epicgames');
const { checkSteamFreeGames } = require('../utils/socialPollers/steam');

const CHECK_INTERVAL_MS = 5 * 60_000; // toutes les 5 minutes (raisonnable pour eviter le rate limit des APIs)

const EPIC_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/240px-Epic_Games_logo.svg.png';
const STEAM_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/240px-Steam_icon_logo.svg.png';

/** Envoie l'embed dans le salon configure, avec un footer "nom du serveur" + horodatage automatique */
async function notify(client, account, embed) {
  const channel = await client.channels.fetch(account.channelId).catch(() => null);
  if (!channel) return;

  if (channel.guild) {
    embed.setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL() || undefined });
  }
  embed.setTimestamp();

  const content = account.message ? account.message : undefined;
  channel.send({ content, embeds: [embed] }).catch(err => {
    console.error(`[SOCIAL] Échec d'envoi dans le salon ${account.channelId} :`, err.message);
  });
}

/**
 * Construit un embed "jeu gratuit" avec description en citation, prix barré, date de fin
 * + compte a rebours (si connue) et lien direct vers la boutique.
 */
function formatFreeGameEmbed(game, { platformLabel, color, thumbnailUrl }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${game.title} gratuit sur ${platformLabel} !`)
    .setURL(game.url)
    .setThumbnail(thumbnailUrl);

  if (game.imageUrl) embed.setImage(game.imageUrl);

  const lines = [];

  if (game.description) {
    lines.push(`> ${game.description.replace(/\n/g, '\n> ')}`, '');
  }

  if (game.originalPrice) {
    const symbol = game.currency === 'EUR' ? '€' : (game.currency || '');
    const priceStr = `${game.originalPrice.toFixed(2).replace('.', ',')} ${symbol}`.trim();
    let priceLine = `~~${priceStr}~~ **Gratuit**`;

    if (game.endDate) {
      const end = new Date(game.endDate);
      const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
      const formattedDate = end.toLocaleDateString('fr-FR');
      priceLine += ` jusqu'au ${formattedDate} ( dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} )`;
    }

    lines.push(priceLine);
  } else {
    lines.push('**Gratuit dès maintenant**');
  }

  lines.push(`🔗 [Ouvrir dans la boutique !](${game.url})`);

  embed.setDescription(lines.join('\n'));
  return embed;
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
      .setImage(result.thumbnailUrl ? `${result.thumbnailUrl}?t=${Date.now()}` : null);
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
      .setImage(result.thumbnailUrl || null);
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
      .setURL(result.url);
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
    console.log(`[SOCIAL] ${newGames.length} nouveau(x) jeu(x) gratuit(s) détecté(s) sur Epic Games :`, newGames.map(g => g.title).join(', '));
    for (const game of newGames) {
      const embed = formatFreeGameEmbed(game, {
        platformLabel: "l'Epic Games Store",
        color: '#313131',
        thumbnailUrl: EPIC_LOGO_URL
      });
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
      const embed = formatFreeGameEmbed(game, {
        platformLabel: 'Steam',
        color: '#1b2838',
        thumbnailUrl: STEAM_LOGO_URL
      });
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
