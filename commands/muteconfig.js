const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('muteconfig')
    .setDescription('Définir le rôle qui sera attribué automatiquement aux membres mute (admin uniquement)')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle mute à utiliser par défaut')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');
    if (!role) {
      await interaction.reply({ content: 'Rôle introuvable.', ephemeral: true });
      return;
    }

    // Charger ou créer settings
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      settings = {};
    }
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].automod) settings[guildId].automod = {};
    settings[guildId].automod.muteRoleId = role.id;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.reply({ content: `🔇 Le rôle <@&${role.id}> sera désormais utilisé pour mute les membres.`, ephemeral: false });
  }
};
