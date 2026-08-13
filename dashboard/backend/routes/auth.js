const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  JWT_SECRET,
  FRONTEND_URL
} = process.env;

// --- Etape 1 : redirection vers Discord ---
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// --- Etape 2 : callback, echange le code contre un token, recupere l'utilisateur ---
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;

    const [userRes] = await Promise.all([
      axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } })
    ]);

    // On ne stocke QUE l'identité + le token d'accès dans le JWT (léger).
    // La liste des serveurs sera récupérée à la demande via ce token, pour éviter
    // de dépasser la limite de taille des cookies (4096 octets) chez les utilisateurs
    // ayant beaucoup de serveurs.
    const sessionToken = jwt.sign(
      {
        id: userRes.data.id,
        username: userRes.data.username,
        avatar: userRes.data.avatar,
        accessToken
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error('[AUTH] Erreur OAuth2 :', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.get('/me', (req, res) => {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ id: user.id, username: user.username, avatar: user.avatar });
  } catch {
    res.status(401).json({ error: 'Session invalide' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

module.exports = router;
