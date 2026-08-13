const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const MemberLevel = require('../../database/models/MemberLevel');
const { xpForLevel } = require('../../utils/levelSystem');
const path = require('path');

try {
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Poppins-Regular.ttf'), 'Poppins Regular');
} catch (e) {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ta carte de niveau (ou celle d\'un autre membre)')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter')),

  async execute(interaction) {
    const user = interaction.options.getUser('membre') || interaction.user;
    await interaction.deferReply();

    const record = await MemberLevel.findOne({ guildId: interaction.guild.id, userId: user.id });
    if (!record) return interaction.editReply(`${user.username} n'a pas encore d'XP sur ce serveur.`);

    // Calcul du rang
    const rank = await MemberLevel.countDocuments({
      guildId: interaction.guild.id,
      totalXp: { $gt: record.totalXp }
    }) + 1;

    const requiredXp = xpForLevel(record.level);

    const WIDTH = 900, HEIGHT = 250;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#23272a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Avatar
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, HEIGHT / 2, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 60, HEIGHT / 2 - 80, 160, 160);
    ctx.restore();

    // Textes
    ctx.fillStyle = '#ffffff';
    ctx.font = '34px "Poppins Bold"';
    ctx.fillText(user.username, 260, 90);

    ctx.font = '22px "Poppins Regular"';
    ctx.fillStyle = '#b9bbbe';
    ctx.fillText(`Rang #${rank}`, 260, 125);
    ctx.fillStyle = '#5865F2';
    ctx.fillText(`Niveau ${record.level}`, 420, 125);

    // Barre XP
    const barX = 260, barY = 160, barW = 580, barH = 26;
    ctx.fillStyle = '#3a3d44';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 13);
    ctx.fill();

    const progress = Math.min(record.xp / requiredXp, 1);
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 13);
    ctx.fill();

    ctx.font = '16px "Poppins Regular"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${record.xp} / ${requiredXp} XP`, barX + 10, barY + 18);

    const buffer = canvas.toBuffer('image/png');
    interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: 'rank.png' })] });
  }
};
