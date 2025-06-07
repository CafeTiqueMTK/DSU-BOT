const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require ('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre')
    .addUserOption(option => option.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('Raison de l\'expulsion').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Tu as enfreint le règlement.';

    const embed = new EmbedBuilder()
      .setTitle('🚪 Expulsion')
      .setDescription(`Tu as été expulsé du serveur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
      .setColor(0xFF0000)
      .setTimestamp();

    try { await member.send({ embeds: [embed] }); } catch (e) {}

    await member.kick(reason);
    await interaction.reply({ content: `✅ ${member.user.tag} a été expulsé.`, ephemeral: true });

    logModerationAction(interaction.guild, member.user, 'Kick', reason, interaction.user);
  }
};
