const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Gérer le système de logs')
    .addSubcommand(cmd =>
      cmd.setName('enable').setDescription('Active le système de logs'))
    .addSubcommand(cmd =>
      cmd.setName('disable').setDescription('Désactive le système de logs'))
    .addSubcommand(cmd =>
      cmd.setName('status').setDescription('Affiche le statut des logs'))
    .addSubcommand(cmd =>
      cmd.setName('reset').setDescription('Réinitialise toute la configuration des logs')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].logs) {
      settings[guildId].logs = {
        enabled: false,
        categories: {
          arrived: false,
          farewell: false,
          vocal: false,
          mod: false,
          automod: false
        }
      };
    }

    const logs = settings[guildId].logs;

    switch (sub) {
      case 'enable':
        logs.enabled = true;
        await interaction.reply('✅ Les logs sont maintenant activés.');
        break;

      case 'disable':
        logs.enabled = false;
        await interaction.reply('❌ Les logs ont été désactivés.');
        break;

      case 'status':
        await interaction.reply(`📋 **Logs activés** : ${logs.enabled ? '✅ Oui' : '❌ Non'}\n` +
          Object.entries(logs.categories)
            .map(([key, val]) => `• \`${key}\` : ${val ? '✅' : '❌'}`)
            .join('\n'));
        break;

      case 'reset':
        settings[guildId].logs = {
          enabled: false,
          categories: {
            arrived: false,
            farewell: false,
            vocal: false,
            mod: false,
            automod: false
          }
        };
        await interaction.reply('♻️ Configuration des logs réinitialisée.');
        break;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
};
