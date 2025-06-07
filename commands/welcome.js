const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configurer le système de bienvenue')
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Afficher le statut du système de bienvenue'))
    .addSubcommand(sub =>
      sub.setName('enable')
        .setDescription('Activer le système de bienvenue'))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver le système de bienvenue'))
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Définir le salon de bienvenue')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Le salon où envoyer les messages de bienvenue')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Envoyer un message de bienvenue de test')),

  async execute(interaction) {
    const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
    const guildId = interaction.guild.id;
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].welcome) {
      settings[guildId].welcome = {
        enabled: false,
        channel: null
      };
    }

    const conf = settings[guildId].welcome;
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      await interaction.reply({
        embeds: [{
          title: '🎉 Statut de Bienvenue',
          fields: [
            { name: 'Statut', value: conf.enabled ? '✅ Activé' : '❌ Désactivé' },
            { name: 'Salon', value: conf.channel ? `<#${conf.channel}>` : 'Non défini' }
          ],
          color: 0x00bfff
        }],
        ephemeral: true
      });

    } else if (sub === 'enable') {
      conf.enabled = true;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '✅ Le système de bienvenue est maintenant activé.', ephemeral: true });

    } else if (sub === 'disable') {
      conf.enabled = false;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '❌ Le système de bienvenue est maintenant désactivé.', ephemeral: true });

    } else if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('salon');
      conf.channel = channel.id;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: `✅ Le salon de bienvenue est maintenant <#${channel.id}>.`, ephemeral: true });

    } else if (sub === 'test') {
      if (!conf.enabled || !conf.channel) return interaction.reply({ content: '⚠️ Le système de bienvenue est désactivé ou aucun salon n\'a été défini.', ephemeral: true });

      const member = interaction.member;
      const channel = interaction.guild.channels.cache.get(conf.channel);
      if (channel) {
        channel.send({
          embeds: [{
            title: `👋 Bienvenue ${member.user.username} !`,
            description: `Nous sommes ravis de t'accueillir sur **${interaction.guild.name}** ! 🎉`,
            thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
            color: 0x00ff99,
            footer: { text: `Utilisateur ID : ${member.id}` },
            timestamp: new Date()
          }]
        });
      }
      await interaction.reply({ content: '✅ Message de bienvenue envoyé.', ephemeral: true });
    }
  }
};
