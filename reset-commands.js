const { REST, Routes } = require('discord.js');
const config = require('./config.json');

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('🗑️ Suppression des commandes...');
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] });
    console.log('✅ Toutes les commandes ont été supprimées.');
  } catch (error) {
    console.error(error);
  }
})();

