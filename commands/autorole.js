const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '..', 'settings.json');

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription("Configure l'attribution automatique d'un rôle aux nouveaux membres.")
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription("Définit le rôle à attribuer automatiquement")
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Rôle à attribuer')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription("Désactive l'autorole"))
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription("Affiche l’état de l’autorole")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }

    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].autorole) settings[guildId].autorole = { enabled: false, roleId: null };

    if (sub === 'set') {
      const role = interaction.options.getRole('role');
      settings[guildId].autorole = {
        enabled: true,
        roleId: role.id
      };
      saveSettings(settings);
      await interaction.reply(`✅ Le rôle ${role.name} sera maintenant attribué automatiquement aux nouveaux membres.`);
    }

    else if (sub === 'disable') {
      settings[guildId].autorole = { enabled: false, roleId: null };
      saveSettings(settings);
      await interaction.reply('❌ L’autorole est maintenant désactivé.');
    }

    else if (sub === 'status') {
      const data = settings[guildId].autorole;
      if (data.enabled) {
        const role = interaction.guild.roles.cache.get(data.roleId);
        await interaction.reply(`📌 L’autorole est activé : **${role?.name || 'Rôle introuvable'}**.`);
      } else {
        await interaction.reply('🚫 L’autorole est actuellement désactivé.');
      }
    }
  }
};
