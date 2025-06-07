const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const presetsFile = './presets.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcelist')
    .setDescription('Liste tous les presets d\'annonces'),

  async execute(interaction) {
    if (!fs.existsSync(presetsFile)) {
      return await interaction.reply('❌ Aucun preset trouvé.');
    }

    const presets = JSON.parse(fs.readFileSync(presetsFile, 'utf-8'));
    const names = Object.keys(presets);

    if (names.length === 0) {
      return await interaction.reply('❌ Aucun preset enregistré.');
    }

    const embed = {
      title: '📃 Liste des presets disponibles',
      description: names.map(name => `• \`${name}\``).join('\n'),
      color: 0x00AEFF,
      timestamp: new Date()
    };

    await interaction.reply({ embeds: [embed] });
  }
};
