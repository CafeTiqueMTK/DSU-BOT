const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logchannelset')
    .setDescription('Définir le salon de logs')
    .addChannelOption(option =>
      option.setName('salon')
        .setDescription('Salon où les logs seront envoyés')
        .setRequired(true)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('salon');

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

    settings[guildId].logs.channel = channel.id;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    await interaction.reply(`📍 Salon de logs défini sur <#${channel.id}>.`);
  }
};
