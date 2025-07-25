const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmoderatorrole')
    .setDescription('Définir le rôle qui a accès à la commande /mod')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle modérateur')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');

    // Charger ou initialiser settings
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      settings = {};
    }
    if (!settings[guildId]) settings[guildId] = {};

    settings[guildId].moderatorRole = role.id;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.reply({ content: `Le rôle <@&${role.id}> peut désormais utiliser la commande /mod.`, ephemeral: true });
  }
};
