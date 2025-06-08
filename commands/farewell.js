const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('farewell')
    .setDescription('Configurer le système d\'au revoir')
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Afficher le statut du système d\'au revoir'))
    .addSubcommand(sub =>
      sub.setName('enable')
        .setDescription('Activer le système d\'au revoir'))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver le système d\'au revoir'))
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Définir le salon d\'au revoir')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Le salon où envoyer les messages d\'au revoir')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Envoyer un message d\'au revoir de test')),

  async execute(interaction) {
    const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
    const guildId = interaction.guild.id;
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].farewell) {
      settings[guildId].farewell = {
        enabled: false,
        channel: null
      };
    }

    const conf = settings[guildId].farewell;
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      await interaction.reply({
        embeds: [{
          title: '👋 Statut du système d\'au revoir',
          fields: [
            { name: 'Statut', value: conf.enabled ? '✅ Activé' : '❌ Désactivé' },
            { name: 'Salon', value: conf.channel ? `<#${conf.channel}>` : 'Non défini' }
          ],
          color: 0xff5555
        }],
        ephemeral: true
      });

    } else if (sub === 'enable') {
      conf.enabled = true;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '✅ Le système d\'au revoir est maintenant activé.', ephemeral: true });

    } else if (sub === 'disable') {
      conf.enabled = false;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '❌ Le système d\'au revoir est maintenant désactivé.', ephemeral: true });

    } else if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('salon');
      conf.channel = channel.id;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
      await interaction.reply({ content: `✅ Le salon d'au revoir est maintenant <#${channel.id}>.`, ephemeral: true });

    } else if (sub === 'test') {
      if (!conf.enabled || !conf.channel) return interaction.reply({ content: '⚠️ Le système d\'au revoir est désactivé ou aucun salon n\'a été défini.', ephemeral: true });

      const member = interaction.member;
      const channel = interaction.guild.channels.cache.get(conf.channel);
      if (channel) {
        channel.send({
          embeds: [{
            title: `😢 Au revoir ${member.user.username}...`,
            description: `Nous espérons te revoir sur **${interaction.guild.name}** !`,
            image: { url: member.user.displayAvatarURL({ dynamic: true }) },
            color: 0xff5555,
            footer: { text: `Utilisateur ID : ${member.id}` },
            timestamp: new Date()
          }]
        });
      }
      await interaction.reply({ content: '✅ Message d\'au revoir envoyé.', ephemeral: true });
    }
  }
};
// This code defines a Discord bot command for managing farewell messages when members leave the server.
// It allows server administrators to enable/disable the farewell system, set a channel for farewell messages, and test the farewell message functionality.