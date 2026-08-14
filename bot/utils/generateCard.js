const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// Police par defaut embarquee (facultatif : place tes .ttf dans /assets/fonts)
try {
  GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), 'Poppins Regular');
} catch (e) {
  // Si les fontes ne sont pas presentes, canvas retombera sur une police systeme
}

/**
 * Genere une carte de bienvenue/depart en PNG (Buffer).
 * Entierement personnalisable : fond (degrade ou image custom), position/taille/opacite
 * de l'avatar, texte optionnel (peut etre masque si le fond contient deja son propre texte,
 * comme un visuel exporte depuis Canva/Photoshop).
 *
 * @param {object} cfg - la sous-config welcome/leave venant de GuildConfig
 * @param {object} data - { username, tag, avatarUrl, memberCount }
 * @returns {Promise<Buffer>}
 */
async function generateCard(cfg, data) {
  const WIDTH = 1000;
  const HEIGHT = 350;
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
    grad.addColorStop(0, cfg.backgroundColorStart || '#1e1e2f');
    grad.addColorStop(1, cfg.backgroundColorEnd || '#5865F2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // --- Bande d'accent en bas (seulement sur fond genere, pas sur une image custom) ---
  if (!cfg.backgroundUrl) {
    ctx.fillStyle = cfg.accentColor || '#5865F2';
    ctx.fillRect(0, HEIGHT - 8, WIDTH, 8);
  }

  // --- Avatar : position et taille entierement configurables (en % de la carte) ---
  const avatarSize = HEIGHT * (Math.min(Math.max(cfg.avatarSize ?? 51, 5), 100) / 100);
  const avatarCenterX = WIDTH * (Math.min(Math.max(cfg.avatarX ?? 15, 0), 100) / 100);
  const avatarCenterY = HEIGHT * (Math.min(Math.max(cfg.avatarY ?? 50, 0), 100) / 100);

  if (cfg.showAvatar !== false) {
    try {
      const avatar = await loadImage(data.avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2 + 6, 0, Math.PI * 2);
      ctx.fillStyle = cfg.accentColor || '#5865F2';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarCenterX - avatarSize / 2, avatarCenterY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } catch (e) { /* avatar indisponible, on ignore */ }
  }

  // --- Texte (masquable si le fond custom contient deja son propre texte) ---
  if (cfg.showText !== false) {
    const avatarRightEdge = cfg.showAvatar !== false ? avatarCenterX + avatarSize / 2 : 0;

    // Position : automatique (a droite de l'avatar, centre verticalement) sauf si explicitement definie
    const textStartX = cfg.textX != null
      ? WIDTH * (Math.min(Math.max(cfg.textX, 0), 100) / 100)
      : Math.max(avatarRightEdge + 50, 90);
    const textCenterY = cfg.textY != null
      ? HEIGHT * (Math.min(Math.max(cfg.textY, 0), 100) / 100)
      : HEIGHT / 2;

    const titleSize = cfg.titleSize ?? 48;
    const subtitleSize = cfg.subtitleSize ?? 32;
    const memberCountSize = cfg.memberCountSize ?? 22;

    ctx.fillStyle = cfg.textColor || '#ffffff';
    ctx.font = `${titleSize}px "Poppins Bold"`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText((cfg.title || 'BIENVENUE').toUpperCase(), textStartX, textCenterY - 15);

    const subtitle = (cfg.subtitle || '{username}')
      .replace('{username}', data.username)
      .replace('{tag}', data.tag);
    ctx.font = `${subtitleSize}px "Poppins Regular"`;
    ctx.fillStyle = cfg.accentColor || '#5865F2';
    ctx.fillText(subtitle, textStartX, textCenterY + 30);

    if (cfg.showMemberCount !== false && data.memberCount) {
      ctx.font = `${memberCountSize}px "Poppins Regular"`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(`Membre #${data.memberCount}`, textStartX, textCenterY + 70);
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Remplace les variables dans un texte (message texte ou embed)
 */
function formatVariables(str, data) {
  return (str || '')
    .replaceAll('{user}', `<@${data.userId}>`)
    .replaceAll('{username}', data.username)
    .replaceAll('{tag}', data.tag)
    .replaceAll('{server}', data.serverName)
    .replaceAll('{memberCount}', data.memberCount);
}

module.exports = { generateCard, formatVariables };
