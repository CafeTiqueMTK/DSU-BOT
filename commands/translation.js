const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translation')
    .setDescription('Configurer le système de traduction automatique')
    .addSubcommand(cmd =>
      cmd.setName('status')
        .setDescription('Afficher le statut du système de traduction'))
    .addSubcommand(cmd =>
      cmd.setName('enable')
        .setDescription('Activer le système de traduction'))
    .addSubcommand(cmd =>
      cmd.setName('disable')
        .setDescription('Désactiver le système de traduction'))
    .addSubcommand(cmd =>
      cmd.setName('setup')
        .setDescription('Configurer la langue source et/ou cible')
        .addStringOption(opt =>
          opt.setName('source')
            .setDescription('Code de la langue source (ex: en, fr, es, de, etc.)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('target')
            .setDescription('Code de la langue cible (ex: en, fr, es, de, etc.)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].translation) {
      settings[guildId].translation = {
        enabled: false,
        source: 'auto',
        target: 'en'
      };
    }
    const translation = settings[guildId].translation;
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      await interaction.reply(
        `🌐 **Translation system**: ${translation.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
        `Source: \`${translation.source}\`\nTarget: \`${translation.target}\``
      );
    } else if (sub === 'enable') {
      translation.enabled = true;
      await interaction.reply('✅ Translation system enabled.');
    } else if (sub === 'disable') {
      translation.enabled = false;
      await interaction.reply('❌ Translation system disabled.');
    } else if (sub === 'setup') {
      const source = interaction.options.getString('source');
      const target = interaction.options.getString('target');
      let msg = '';
      if (source) {
        translation.source = source;
        msg += `Source set to \`${source}\`. `;
      }
      if (target) {
        translation.target = target;
        msg += `Target set to \`${target}\`. `;
      }
      if (!source && !target) {
        msg = 'No language updated. Please provide at least one option.';
      }
      await interaction.reply(`🔧 ${msg.trim()}`);
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
};
