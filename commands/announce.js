const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

const presetsFile = './presets.json';
if (!fs.existsSync(presetsFile)) fs.writeFileSync(presetsFile, '{}');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Système d’annonce avec presets')
    .addSubcommand(sub =>
      sub.setName('preset')
        .setDescription('Gérer les presets')
        .addStringOption(opt => opt.setName('action').setDescription('add/remove').setRequired(true))
        .addStringOption(opt => opt.setName('name').setDescription('Nom du preset').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Titre de l’embed').setRequired(false))
        .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(false))
        .addStringOption(opt => opt.setName('footer').setDescription('Footer').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Envoyer une annonce')
        .addChannelOption(opt => opt.setName('channel').setDescription('Salon de destination').setRequired(true))
        .addStringOption(opt => opt.setName('preset').setDescription('Nom du preset à envoyer').setRequired(false))
        .addStringOption(opt => opt.setName('title').setDescription('Titre').setRequired(false))
        .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(false))
        .addStringOption(opt => opt.setName('footer').setDescription('Footer').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const presets = JSON.parse(fs.readFileSync(presetsFile, 'utf-8'));

    if (sub === 'preset') {
      const action = interaction.options.getString('action');
      const name = interaction.options.getString('name');

      if (action === 'add') {
        const title = interaction.options.getString('title') || '';
        const description = interaction.options.getString('description') || '';
        const footer = interaction.options.getString('footer') || '';
        presets[name] = { title, description, footer };
        fs.writeFileSync(presetsFile, JSON.stringify(presets, null, 2));
        await interaction.reply(`✅ Preset \`${name}\` ajouté.`);
      } else if (action === 'remove') {
        if (!presets[name]) return await interaction.reply(`❌ Ce preset n'existe pas.`);
        delete presets[name];
        fs.writeFileSync(presetsFile, JSON.stringify(presets, null, 2));
        await interaction.reply(`🗑️ Preset \`${name}\` supprimé.`);
      } else {
        await interaction.reply(`❌ Action invalide. Utilise \`add\` ou \`remove\`.`);
      }

    } else if (sub === 'send') {
      const presetName = interaction.options.getString('preset');
      const channel = interaction.options.getChannel('channel');
      let title = interaction.options.getString('title');
      let description = interaction.options.getString('description');
      let footer = interaction.options.getString('footer');

      if (presetName && presets[presetName]) {
        title = title || presets[presetName].title;
        description = description || presets[presetName].description;
        footer = footer || presets[presetName].footer;
      }

      if (!title && !description) return interaction.reply(`❌ Titre ou description requis.`);

      const embed = {
        title,
        description,
        color: 0x00AEFF,
        footer: { text: footer || '' },
        timestamp: new Date()
      };

      await channel.send({ embeds: [embed] });
      await interaction.reply(`📢 Annonce envoyée dans ${channel}.`);
    }
  }
};
