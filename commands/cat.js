const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

// __dirname est déjà disponible en CommonJS, pas besoin de fileURLToPath
const imagePath = path.join(__dirname, '../assets/cat.jpg');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Envoie une image de chat 🐱'),

  async execute(interaction) {
    const file = new AttachmentBuilder(imagePath);
    await interaction.reply({ content: 'Voici un chat 🐱', files: [file] });
  }
};
