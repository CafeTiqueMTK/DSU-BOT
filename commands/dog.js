const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

// __dirname est déjà disponible en CommonJS
const imagePath = path.join(__dirname, '../assets/dog.jpg');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Envoie une image de chien'),

  async execute(interaction) {
    const file = new AttachmentBuilder(imagePath);
    await interaction.reply({ content: 'Voici doge', files: [file] });
  }
};
