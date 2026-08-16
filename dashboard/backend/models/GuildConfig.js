const { Schema, model } = require('mongoose');

/**
 * Une carte de bienvenue/depart est entierement configurable
 * pour permettre un rendu "live preview" identique cote dashboard et cote bot.
 */
const CardConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  mode: { type: String, enum: ['embed', 'image', 'both'], default: 'image' },

  // Texte (variables supportees: {user} {username} {tag} {server} {memberCount})
  message: { type: String, default: 'Bienvenue {user} sur **{server}** ! Tu es le membre n°{memberCount} 🎉' },

  // Rendu image
  title: { type: String, default: 'BIENVENUE' },
  subtitle: { type: String, default: '{username}' },
  backgroundUrl: { type: String, default: '' }, // image de fond custom, sinon degrade genere
  backgroundOverlayOpacity: { type: Number, default: 0, min: 0, max: 100 }, // assombrissement du fond custom (0 = image intacte)
  backgroundColorStart: { type: String, default: '#1e1e2f' },
  backgroundColorEnd: { type: String, default: '#5865F2' },
  textColor: { type: String, default: '#ffffff' },
  accentColor: { type: String, default: '#5865F2' },
  showAvatar: { type: Boolean, default: true },
  showMemberCount: { type: Boolean, default: true },
  showText: { type: Boolean, default: true }, // permet de masquer titre/sous-titre si le fond contient deja son propre texte
  avatarX: { type: Number, default: 15, min: 0, max: 100 }, // position horizontale du centre de l'avatar, en % de la largeur
  avatarY: { type: Number, default: 50, min: 0, max: 100 }, // position verticale du centre de l'avatar, en % de la hauteur
  avatarSize: { type: Number, default: 51, min: 5, max: 100 }, // diametre de l'avatar, en % de la hauteur de la carte

  // Position INDEPENDANTE de chaque element de texte : null = automatique (a droite de l'avatar,
  // empile verticalement dans l'ordre titre > sous-titre > compteur)
  titleX: { type: Number, default: null, min: 0, max: 100 },
  titleY: { type: Number, default: null, min: 0, max: 100 },
  subtitleX: { type: Number, default: null, min: 0, max: 100 },
  subtitleY: { type: Number, default: null, min: 0, max: 100 },
  memberCountX: { type: Number, default: null, min: 0, max: 100 },
  memberCountY: { type: Number, default: null, min: 0, max: 100 },

  // Tailles de police independantes, en pixels
  titleSize: { type: Number, default: 48, min: 10, max: 100 },
  subtitleSize: { type: Number, default: 32, min: 10, max: 100 },
  memberCountSize: { type: Number, default: 22, min: 8, max: 60 },

  // Embed (si mode embed/both)
  embedColor: { type: String, default: '#5865F2' },
  embedThumbnail: { type: Boolean, default: true }, // petite miniature avatar (haut droite)
  embedImageEnabled: { type: Boolean, default: true }, // grande image dans le corps de l'embed
  embedImageSource: { type: String, enum: ['avatar', 'card', 'custom'], default: 'card' }, // avatar = photo du membre, card = carte generee, custom = URL fournie
  embedImageUrl: { type: String, default: '' }, // utilisee si embedImageSource === 'custom'

  // DM optionnel envoye au membre
  dmEnabled: { type: Boolean, default: false },
  dmMessage: { type: String, default: 'Bienvenue sur {server} ! N’oublie pas de lire le règlement.' }
}, { _id: false });

const AutomodSchema = new Schema({
  enabled: { type: Boolean, default: false },
  antiInvite: { type: Boolean, default: false },
  antiLink: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: true },
  spamThreshold: { type: Number, default: 5 }, // messages
  spamIntervalMs: { type: Number, default: 5000 },
  bannedWords: { type: [String], default: [] },
  antiCapsPercent: { type: Number, default: 0 }, // 0 = desactive
  mentionSpamLimit: { type: Number, default: 5 },
  ignoredChannels: { type: [String], default: [] },
  ignoredRoles: { type: [String], default: [] },
  action: { type: String, enum: ['delete', 'warn', 'mute', 'kick'], default: 'delete' }
}, { _id: false });

const RankCardConfigSchema = new Schema({
  backgroundUrl: { type: String, default: '' },
  backgroundOverlayOpacity: { type: Number, default: 0, min: 0, max: 100 },
  backgroundColorStart: { type: String, default: '#23272a' },
  backgroundColorEnd: { type: String, default: '#23272a' },
  textColor: { type: String, default: '#ffffff' },
  accentColor: { type: String, default: '#5865F2' }, // couleur de la barre de progression + niveau
  avatarX: { type: Number, default: 16, min: 0, max: 100 },
  avatarY: { type: Number, default: 50, min: 0, max: 100 },
  avatarSize: { type: Number, default: 65, min: 5, max: 100 }
}, { _id: false });

const LevelingSchema = new Schema({
  enabled: { type: Boolean, default: true },
  xpMin: { type: Number, default: 15 },
  xpMax: { type: Number, default: 25 },
  cooldownSeconds: { type: Number, default: 60 },
  levelUpChannelId: { type: String, default: null }, // null = envoie dans le salon du message
  levelUpMessage: { type: String, default: 'GG {user}, tu passes niveau **{level}** ! 🎉' },
  levelUpMode: { type: String, enum: ['text', 'card', 'both'], default: 'text' },
  levelUpCard: {
    type: CardConfigSchema,
    default: () => ({ title: 'NIVEAU UP !', subtitle: '{username}', showMemberCount: false })
  },
  rankCard: { type: RankCardConfigSchema, default: () => ({}) },
  ignoredChannels: { type: [String], default: [] },
  roleRewards: [{
    level: Number,
    roleId: String
  }],
  noXpRoles: { type: [String], default: [] }
}, { _id: false });

const LogsSchema = new Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  events: {
    messageDelete: { type: Boolean, default: true },
    messageEdit: { type: Boolean, default: true },
    memberJoin: { type: Boolean, default: true },
    memberLeave: { type: Boolean, default: true },
    memberBan: { type: Boolean, default: true },
    memberUnban: { type: Boolean, default: true },
    roleChanges: { type: Boolean, default: false },
    voiceChanges: { type: Boolean, default: false }
  }
}, { _id: false });

const EconomySchema = new Schema({
  enabled: { type: Boolean, default: false },
  currencyName: { type: String, default: 'Pièces' },
  currencySymbol: { type: String, default: '🪙' },
  dailyAmount: { type: Number, default: 100 },
  workMin: { type: Number, default: 20 },
  workMax: { type: Number, default: 80 }
}, { _id: false });

const CustomCommandSchema = new Schema({
  name: { type: String, required: true },
  response: { type: String, required: true },
  enabled: { type: Boolean, default: true }
}, { _id: false });

const RolePanelEntrySchema = new Schema({
  emoji: { type: String, default: '' },
  label: { type: String, default: '' }, // affiche sur les boutons/menu deroulant
  roleId: { type: String, required: true },
  buttonColor: { type: String, enum: ['gray', 'blurple', 'green', 'red'], default: 'gray' } // utilise seulement si componentType = 'button'
}, { _id: false });

const AutoRolesConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  roleIds: { type: [String], default: [] } // roles attribues automatiquement a chaque nouvel arrivant
}, { _id: false });

const TicketsConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  categoryId: { type: String, default: null }, // categorie ou creer les salons de ticket
  supportRoleIds: { type: [String], default: [] },
  transcriptChannelId: { type: String, default: null },
  panelChannelId: { type: String, default: null },
  panelMessageId: { type: String, default: null },
  buttonLabel: { type: String, default: 'Créer un ticket' },
  welcomeMessage: { type: String, default: 'Bienvenue {user} ! Décris ton problème, un membre du support te répondra bientôt.' },
  maxOpenPerUser: { type: Number, default: 1, min: 1, max: 10 }
}, { _id: false });

const BirthdaysConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  message: { type: String, default: '🎉 Joyeux anniversaire {user} !! 🎂' },
  roleId: { type: String, default: null } // role optionnel attribue le jour J (retire le lendemain)
}, { _id: false });

const ReactionRoleSchema = new Schema({
  messageId: String,
  channelId: String,
  componentType: { type: String, enum: ['reaction', 'button', 'select'], default: 'reaction' },
  mode: { type: String, enum: ['multi', 'unique'], default: 'multi' }, // multi = plusieurs roles cumulables, unique = un seul a la fois (exclusif)
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  color: { type: String, default: '#5865F2' },
  pairs: { type: [RolePanelEntrySchema], default: [] }
}, { _id: false });

const GuildConfigSchema = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  guildName: { type: String, default: '' },
  prefix: { type: String, default: '!' },

  welcome: { type: CardConfigSchema, default: () => ({}) },
  leave: { type: CardConfigSchema, default: () => ({ title: 'AU REVOIR', message: '{username} a quitté **{server}**. On était {memberCount} maintenant.' }) },

  automod: { type: AutomodSchema, default: () => ({}) },
  leveling: { type: LevelingSchema, default: () => ({}) },
  logs: { type: LogsSchema, default: () => ({}) },
  economy: { type: EconomySchema, default: () => ({}) },

  customCommands: { type: [CustomCommandSchema], default: [] },
  reactionRoles: { type: [ReactionRoleSchema], default: [] },

  moderatorRoleIds: { type: [String], default: [] },
  muteRoleId: { type: String, default: null },

  tickets: { type: TicketsConfigSchema, default: () => ({}) },
  birthdays: { type: BirthdaysConfigSchema, default: () => ({}) },
  autoRoles: { type: AutoRolesConfigSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = model('GuildConfig', GuildConfigSchema);
