const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

function logModerationAction(guild, userTag, action, reason, moderator) {
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const conf = settings[guild.id]?.logs;

  if (conf?.enabled && conf.categories?.mod && conf.channel) {
    const logChannel = guild.channels.cache.get(conf.channel);
    if (logChannel) {
      logChannel.send({
        embeds: [{
          title: `✅ Action de modération : ${action}`,
          fields: [
            { name: 'Utilisateur', value: userTag, inline: true },
            { name: 'Modérateur', value: `${moderator.tag}`, inline: true },
            { name: 'Raison', value: reason || 'Non spécifiée' }
          ],
          color: 0x00ff00,
          timestamp: new Date()
        }]
      });
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur via son ID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription("L'ID de l'utilisateur à débannir")
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('La raison du débannissement')
        .setRequired(false)),
  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

    try {
      const user = await interaction.guild.bans.fetch(userId);
      if (!user) {
        return interaction.reply({ content: "Cet utilisateur n'est pas banni.", ephemeral: true });
      }

      await interaction.guild.members.unban(userId, reason);
      await interaction.reply({ content: `✅ L'utilisateur \`${user.user.tag}\` a été débanni.`, ephemeral: false });

      logModerationAction(interaction.guild, user.user.tag, 'Unban', reason, interaction.user);

    } catch (error) {
      console.error('Erreur lors du débannissement :', error);
      interaction.reply({ content: "❌ Une erreur s'est produite lors du débannissement.", ephemeral: true });
    }
  }
};
