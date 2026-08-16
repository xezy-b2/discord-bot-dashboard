const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

try {
  GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), 'Poppins Regular');
} catch (e) { /* police systeme de secours si les .ttf sont absents */ }

/**
 * Genere la carte affichee par /rank : avatar, pseudo, rang, niveau, barre de progression XP.
 * Personnalisable : fond (degrade ou image custom), position/taille de l'avatar, couleurs.
 * La barre de progression et les textes rang/niveau/XP restent positionnes automatiquement
 * autour de l'avatar (pas de repositionnement individuel, contrairement aux cartes bienvenue/depart).
 *
 * @param {object} cfg - config.leveling.rankCard
 * @param {object} data - { username, avatarUrl, rank, level, xp, requiredXp }
 * @returns {Promise<Buffer>}
 */
async function generateRankCard(cfg, data) {
  const WIDTH = 900;
  const HEIGHT = 250;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // --- Fond ---
  if (cfg.backgroundUrl) {
    try {
      const bg = await loadImage(cfg.backgroundUrl);
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      const overlay = Math.min(Math.max(cfg.backgroundOverlayOpacity ?? 0, 0), 100) / 100;
      if (overlay > 0) {
        ctx.fillStyle = `rgba(0,0,0,${overlay})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
    } catch (e) {
      drawGradientBg();
    }
  } else {
    drawGradientBg();
  }

  function drawGradientBg() {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, cfg.backgroundColorStart || '#23272a');
    grad.addColorStop(1, cfg.backgroundColorEnd || '#23272a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // --- Avatar ---
  const avatarSize = HEIGHT * (Math.min(Math.max(cfg.avatarSize ?? 65, 5), 100) / 100);
  const avatarCenterX = WIDTH * (Math.min(Math.max(cfg.avatarX ?? 16, 0), 100) / 100);
  const avatarCenterY = HEIGHT * (Math.min(Math.max(cfg.avatarY ?? 50, 0), 100) / 100);

  try {
    const avatar = await loadImage(data.avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarCenterX - avatarSize / 2, avatarCenterY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch (e) { /* avatar indisponible, on ignore */ }

  // --- Textes et barre, positionnes a droite de l'avatar (3 lignes : pseudo > niveau > rang) ---
  const textStartX = avatarCenterX + avatarSize / 2 + 40;
  const barWidth = WIDTH - textStartX - 40;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cfg.textColor || '#ffffff';
  ctx.font = '34px "Poppins Bold"';
  ctx.fillText(data.username, textStartX, avatarCenterY - 50);

  ctx.font = '22px "Poppins Regular"';
  ctx.fillStyle = cfg.accentColor || '#5865F2';
  ctx.fillText(`Niveau ${data.level}`, textStartX, avatarCenterY - 15);

  ctx.font = '18px "Poppins Regular"';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`Rang #${data.rank}`, textStartX, avatarCenterY + 12);

  // Barre de progression XP
  const barY = avatarCenterY + 32;
  const barHeight = 26;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(textStartX, barY, barWidth, barHeight, 13);
  ctx.fill();

  const progress = Math.min(data.xp / data.requiredXp, 1);
  ctx.fillStyle = cfg.accentColor || '#5865F2';
  ctx.beginPath();
  ctx.roundRect(textStartX, barY, barWidth * progress, barHeight, 13);
  ctx.fill();

  ctx.font = '15px "Poppins Regular"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.xp} / ${data.requiredXp} XP`, textStartX + 10, barY + 18);

  return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };
