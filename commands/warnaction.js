const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnaction')
    .setDescription('Définit une action automatique selon un nombre de warns')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Nombre de warns requis pour appliquer l\'action')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action à effectuer (warn, mute, kick, ban)')
        .setRequired(true)
        .addChoices(
          { name: 'warn', value: 'warn' },
          { name: 'mute', value: 'mute' },
          { name: 'kick', value: 'kick' },
          { name: 'ban', value: 'ban' }
        )
    )
    .addIntegerOption(option =>
      option.setName('duree')
        .setDescription('Durée du mute en minutes (uniquement pour mute)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const count = interaction.options.getInteger('count');
    const action = interaction.options.getString('action');
    const duree = interaction.options.getInteger('duree');
    const guildId = interaction.guild.id;

    const warnsPath = path.join(__dirname, '../warns.json');
    let warnsData = {};

    if (fs.existsSync(warnsPath)) {
      warnsData = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
    }

    if (!warnsData[guildId]) warnsData[guildId] = {};
    if (!warnsData[guildId].actions) warnsData[guildId].actions = [];

    // Vérifier s'il y a déjà une règle avec ce count
    const existingIndex = warnsData[guildId].actions.findIndex(a => a.count === count);
    if (existingIndex !== -1) {
      warnsData[guildId].actions[existingIndex].action = action;
      if (action === 'mute') {
        warnsData[guildId].actions[existingIndex].duree = duree || 10;
      } else {
        delete warnsData[guildId].actions[existingIndex].duree;
      }
    } else {
      const rule = { count, action };
      if (action === 'mute') rule.duree = duree || 10;
      warnsData[guildId].actions.push(rule);
    }

    fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

    return interaction.reply({
      content: `✅ Action **${action}** définie pour **${count} warns**.` + (action === 'mute' ? ` (Durée : ${duree || 10} min)` : ''),
      ephemeral: true
    });
  }
};
