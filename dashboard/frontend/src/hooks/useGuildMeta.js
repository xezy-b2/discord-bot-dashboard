import { useEffect, useState } from 'react';
import api from '../api/client';

export function useGuildMeta(guildId) {
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    Promise.all([
      api.get(`/guilds/${guildId}/channels`),
      api.get(`/guilds/${guildId}/roles`)
    ]).then(([c, r]) => {
      setChannels(c.data);
      setRoles(r.data);
    }).finally(() => setLoading(false));
  }, [guildId]);

  return { channels, roles, loading };
}
