const { Schema, model } = require('mongoose');

const SocialAccountSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['twitch', 'youtube', 'tiktok', 'epicgames', 'steam'], required: true },
  identifier: { type: String, required: true }, // pseudo Twitch/TikTok, ID de chaine YouTube, AppID Steam...
  displayName: { type: String, default: '' }, // nom affiche dans les notifications
  channelId: { type: String, required: true }, // salon Discord ou poster la notif
  message: { type: String, default: '' }, // template custom, sinon message par defaut selon la plateforme
  enabled: { type: Boolean, default: true },
  lastState: { type: Schema.Types.Mixed, default: null }, // dernier etat connu (video id, live/offline, etc.)
  lastCheckedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = model('SocialAccount', SocialAccountSchema);
