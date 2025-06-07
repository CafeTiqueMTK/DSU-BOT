const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Réduit un membre au silence (rôle Muted requis)')
    .addUserOption(option => option.setName('membre').setDescription('Membre à mute').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('Raison du mute').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Tu as enfreint le règlement.';
    const mutedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');

    if (!mutedRole) {
      return await interaction.reply({ content: '❌ Le rôle `Muted` est introuvable.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔇 Silence imposé')
      .setDescription(`Tu as été réduit au silence sur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
      .setColor(0x5555ff)
      .setTimestamp();

    try { await member.send({ embeds: [embed] }); } catch (e) {}

    await member.roles.add(mutedRole);
    await interaction.reply({ content: `✅ ${member.user.tag} a été mute.`, ephemeral: true });

    logModerationAction(interaction.guild, member.user, 'Mute', reason, interaction.user);
  }
};
