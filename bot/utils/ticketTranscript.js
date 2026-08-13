/**
 * Recupere tous les messages d'un salon de ticket (paginate) et genere un fichier HTML
 * autonome qui reproduit visuellement l'interface de Discord (theme sombre).
 */
async function generateTranscript(channel) {
  const allMessages = [];
  let lastId = null;

  // Discord limite a 100 messages par appel, on paginate jusqu'a tout recuperer
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;
    allMessages.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  allMessages.reverse(); // ordre chronologique

  const escapeHtml = (str = '') => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const formatContent = (content) => {
    // Rendu tres simplifie du markdown Discord (gras, italique, code, retours a la ligne)
    let html = escapeHtml(content);
    html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  };

  const messagesHtml = allMessages.map(msg => {
    const author = msg.author;
    const roleColor = msg.member?.displayHexColor && msg.member.displayHexColor !== '#000000'
      ? msg.member.displayHexColor
      : '#f2f3f5';
    const avatar = author.displayAvatarURL({ extension: 'png', size: 64 });
    const timestamp = new Date(msg.createdTimestamp).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const attachmentsHtml = msg.attachments.size > 0
      ? Array.from(msg.attachments.values()).map(att => {
          const isImage = /\.(png|jpe?g|gif|webp)$/i.test(att.name || '');
          return isImage
            ? `<div class="attachment"><img src="${att.url}" alt="${escapeHtml(att.name || 'image')}" /></div>`
            : `<div class="attachment"><a href="${att.url}" target="_blank">📎 ${escapeHtml(att.name || 'fichier')}</a></div>`;
        }).join('')
      : '';

    const embedsHtml = msg.embeds.length > 0
      ? msg.embeds.map(e => `
          <div class="embed" style="border-left-color: ${e.hexColor || '#5865F2'}">
            ${e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : ''}
            ${e.description ? `<div class="embed-desc">${formatContent(e.description)}</div>` : ''}
          </div>
        `).join('')
      : '';

    return `
      <div class="message">
        <img class="avatar" src="${avatar}" alt="" />
        <div class="message-body">
          <div class="message-header">
            <span class="author" style="color:${roleColor}">${escapeHtml(author.username)}</span>
            <span class="timestamp">${timestamp}</span>
          </div>
          <div class="content">${formatContent(msg.content)}</div>
          ${attachmentsHtml}
          ${embedsHtml}
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Transcription — ${escapeHtml(channel.name)}</title>
<style>
  body {
    background: #313338;
    color: #dbdee1;
    font-family: 'gg sans', 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 24px;
  }
  .header {
    max-width: 820px;
    margin: 0 auto 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #3f4147;
  }
  .header h1 { font-size: 20px; margin: 0 0 4px; color: #f2f3f5; }
  .header p { margin: 0; color: #949ba4; font-size: 13px; }
  .messages { max-width: 820px; margin: 0 auto; }
  .message { display: flex; gap: 16px; padding: 8px 0; }
  .message:hover { background: #2e3035; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
  .message-body { min-width: 0; }
  .message-header { display: flex; align-items: baseline; gap: 8px; }
  .author { font-weight: 600; font-size: 15px; }
  .timestamp { font-size: 11px; color: #949ba4; }
  .content { font-size: 15px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }
  code { background: #2b2d31; padding: 1px 4px; border-radius: 4px; font-family: monospace; }
  pre { background: #2b2d31; padding: 8px; border-radius: 6px; overflow-x: auto; font-family: monospace; }
  .attachment img { max-width: 400px; max-height: 300px; border-radius: 6px; margin-top: 6px; display: block; }
  .attachment a { color: #00a8fc; text-decoration: none; }
  .embed { border-left: 4px solid #5865F2; background: #2b2d31; border-radius: 4px; padding: 10px 12px; margin-top: 6px; max-width: 500px; }
  .embed-title { font-weight: 600; margin-bottom: 4px; }
  .embed-desc { font-size: 14px; color: #dbdee1; }
</style>
</head>
<body>
  <div class="header">
    <h1>#${escapeHtml(channel.name)}</h1>
    <p>${allMessages.length} message(s) — généré le ${new Date().toLocaleString('fr-FR')}</p>
  </div>
  <div class="messages">
    ${messagesHtml || '<p style="color:#949ba4">Aucun message.</p>'}
  </div>
</body>
</html>`;
}

module.exports = { generateTranscript };
