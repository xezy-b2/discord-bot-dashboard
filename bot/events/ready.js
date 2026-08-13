module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[BOT] Connecté en tant que ${client.user.tag} (${client.guilds.cache.size} serveurs)`);
    client.user.setActivity('/help | dashboard', { type: 3 }); // 3 = Watching
  }
};
