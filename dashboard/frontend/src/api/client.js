import axios from 'axios';

// URL directe du backend : utilisée UNIQUEMENT pour la redirection OAuth2 (navigation complète
// du navigateur, pas une requête XHR), car cette étape doit sortir de l'origine du frontend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Toutes les requêtes API passent par le chemin relatif "/api", intercepté par le proxy Vite
// (voir vite.config.js) qui les transmet au backend. Le navigateur voit alors le frontend
// et le backend comme une seule et même origine : plus aucune ambiguïté sur l'envoi du cookie
// de session, quel que soit le navigateur.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

export default api;
