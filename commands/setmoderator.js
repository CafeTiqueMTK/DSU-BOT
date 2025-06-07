const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmoderatorrole')
    .setDescription('Ajouter ou retirer un rôle modérateur')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à ajouter ou retirer des modérateurs')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('remove')
        .setDescription('Retirer le rôle des modérateurs')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');
    const remove = interaction.options.getBoolean('remove') || false;

    // Charger ou initialiser settings
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      settings = {};
    }
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].moderatorRoles) settings[guildId].moderatorRoles = [];

    if (remove) {
      settings[guildId].moderatorRoles = settings[guildId].moderatorRoles.filter(r => r !== role.id);
      await interaction.reply(`❌ Le rôle <@&${role.id}> n'est plus modérateur.`);
    } else {
      if (!settings[guildId].moderatorRoles.includes(role.id)) {
        settings[guildId].moderatorRoles.push(role.id);
      }
      await interaction.reply(`✅ Le rôle <@&${role.id}> est maintenant modérateur.`);
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
};
