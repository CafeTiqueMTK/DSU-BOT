const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le rôle mute à un utilisateur')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Utilisateur à unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) {
      await interaction.reply({ content: 'Utilisateur introuvable sur ce serveur.', ephemeral: true });
      return;
    }

    const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'mute');
    if (!muteRole) {
      await interaction.reply({ content: 'Aucun rôle "mute" trouvé sur ce serveur.', ephemeral: true });
      return;
    }

    if (!member.roles.cache.has(muteRole.id)) {
      await interaction.reply({ content: 'Cet utilisateur n\'est pas mute.', ephemeral: true });
      return;
    }

    await member.roles.remove(muteRole, `Unmute par ${interaction.user.tag}`);
    await interaction.reply({ content: `🔊 <@${member.id}> a été unmute.`, ephemeral: false });
  }
};
