const BUTTON_STYLES = { gray: 2, blurple: 1, green: 3, red: 4 }; // Secondary, Primary, Success, Danger

/** Convertit "😀" ou "<a?:nom:id>" en objet emoji Discord {name} ou {name,id,animated} */
function parseEmoji(emojiStr) {
  if (!emojiStr) return undefined;
  const customMatch = emojiStr.match(/^<(a)?:(\w+):(\d+)>$/);
  if (customMatch) {
    return { name: customMatch[2], id: customMatch[3], animated: !!customMatch[1] };
  }
  return { name: emojiStr };
}

/**
 * Construit le message Discord (embed + éventuels composants) pour un panneau de rôles,
 * a partir de sa config stockee en base (title, description, color, componentType, mode, pairs).
 */
function buildPanelPayload(panel) {
  const embed = {
    title: panel.title || undefined,
    description: panel.description || undefined,
    color: panel.color ? parseInt(panel.color.replace('#', ''), 16) : 0x5865F2
  };

  const payload = { embeds: [embed] };

  if (panel.componentType === 'button') {
    // Max 5 boutons par ligne, max 5 lignes -> 25 boutons max
    const rows = [];
    for (let i = 0; i < panel.pairs.length; i += 5) {
      const chunk = panel.pairs.slice(i, i + 5);
      rows.push({
        type: 1,
        components: chunk.map(p => ({
          type: 2,
          style: BUTTON_STYLES[p.buttonColor] || 2,
          label: p.label || undefined,
          emoji: parseEmoji(p.emoji),
          custom_id: `rr_${p.roleId}`
        }))
      });
    }
    payload.components = rows;
  }

  if (panel.componentType === 'select') {
    const isUnique = panel.mode === 'unique';
    payload.components = [{
      type: 1,
      components: [{
        type: 3, // string select
        custom_id: 'rrsel',
        placeholder: panel.mode === 'unique' ? 'Choisis un rôle...' : 'Choisis un ou plusieurs rôles...',
        min_values: isUnique ? 1 : 0,
        max_values: isUnique ? 1 : Math.min(panel.pairs.length, 25),
        options: panel.pairs.slice(0, 25).map(p => ({
          label: p.label || 'Rôle',
          value: p.roleId,
          emoji: parseEmoji(p.emoji)
        }))
      }]
    }];
  }

  // Pour 'reaction', pas de composants : les emojis sont ajoutes comme reactions apres l'envoi

  return payload;
}

module.exports = { buildPanelPayload, parseEmoji, BUTTON_STYLES };
