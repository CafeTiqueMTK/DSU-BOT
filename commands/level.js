const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Système de niveaux')
    .addSubcommand(cmd =>
      cmd.setName('setchannel')
        .setDescription('Définir le salon pour les annonces de niveau')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Salon pour les annonces de niveau')
            .setRequired(true)
        )
    )
    .addSubcommand(cmd =>
      cmd.setName('setrolebooster')
        .setDescription('Définir un rôle qui donne un bonus d\'expérience')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Rôle booster')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('bonus')
            .setDescription('Facteur multiplicateur d\'expérience (ex: 2 = x2, 3 = x3)')
            .setRequired(true)
        )
    )
    .addSubcommand(cmd =>
      cmd.setName('enable')
        .setDescription('Activer le système de niveaux')
    )
    .addSubcommand(cmd =>
      cmd.setName('disable')
        .setDescription('Désactiver le système de niveaux')
    )
    .addSubcommand(cmd =>
      cmd.setName('status')
        .setDescription('Afficher le statut du système de niveaux')
    )
    .addSubcommand(cmd =>
      cmd.setName('reset')
        .setDescription('Réinitialiser toutes les données de niveau')
    )
    .addSubcommand(cmd =>
      cmd.setName('messagetest')
        .setDescription('Tester le message de gain de niveau')),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].level) {
      settings[guildId].level = {
        enabled: false,
        channel: null,
        boosters: {}, // { roleId: multiplicateur }
        users: {} // { userId: { xp, level } }
      };
    }
    const level = settings[guildId].level;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setchannel') {
      const salon = interaction.options.getChannel('salon');
      level.channel = salon.id;
      await interaction.reply(`📢 Salon d'annonce de niveau défini sur <#${salon.id}>.`);
    } else if (sub === 'setrolebooster') {
      const role = interaction.options.getRole('role');
      const bonus = interaction.options.getInteger('bonus');
      if (bonus < 1) {
        await interaction.reply('❌ Le facteur de boost doit être supérieur ou égal à 1.');
        return;
      }
      level.boosters[role.id] = bonus;
      await interaction.reply(`🚀 Le rôle <@&${role.id}> donne maintenant un bonus x${bonus} d'expérience.`);
    } else if (sub === 'enable') {
      level.enabled = true;
      await interaction.reply('✅ Système de niveaux activé.');
    } else if (sub === 'disable') {
      level.enabled = false;
      await interaction.reply('❌ Système de niveaux désactivé.');
    } else if (sub === 'status') {
      let boosters = Object.entries(level.boosters)
        .map(([rid, mult]) => `<@&${rid}>: x${mult}`)
        .join('\n') || 'Aucun';
      await interaction.reply(
        `🎚️ **Système de niveaux**: ${level.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
        `Salon d'annonce: ${level.channel ? `<#${level.channel}>` : 'Non défini'}\n` +
        `Rôles boosters:\n${boosters}`
      );
    } else if (sub === 'reset') {
      level.users = {};
      await interaction.reply('♻️ Toutes les données de niveau ont été réinitialisées.');
    } else if (sub === 'messagetest') {
      if (!level.channel) return await interaction.reply('❌ Aucun salon configuré.');
      const channel = interaction.guild.channels.cache.get(level.channel);
      if (!channel) return await interaction.reply('❌ Salon introuvable.');
      await channel.send({
        embeds: [{
          title: '🎉 Nouveau niveau !',
          description: `<@${interaction.user.id}> vient de passer au niveau **2** !`,
          color: 0x00ff99,
          footer: { text: 'DSU level system' },
          timestamp: new Date()
        }]
      });
      await interaction.reply('✅ Message de test envoyé.');
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
};
