const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translation')
    .setDescription('Système de traduction de message (en construction)'),
  async execute(interaction) {
    await interaction.reply({
      content: '🚧 La commande de traduction est en construction.',
      ephemeral: true
    });
  }
};
