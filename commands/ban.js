const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre')
    .addUserOption(option =>
      option.setName('membre').setDescription('Membre à bannir').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison').setDescription('Raison du bannissement').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Tu as enfreint le règlement.';

    const embed = new EmbedBuilder()
      .setTitle('⛔ Bannissement')
      .setDescription(`Tu as été banni du serveur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
      .setColor(0x8B0000)
      .setTimestamp();

    try {
      await target.send({ embeds: [embed] });
    } catch (e) {
      console.warn(`Impossible d’envoyer un DM à ${target.tag}`);
    }

    await interaction.guild.members.ban(target.id, { reason });
    await interaction.reply({ content: `✅ ${target.tag} a été banni.`, ephemeral: true });

    function logModerationAction(guild, user, action, reason, moderator) {
      const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
      const guildId = guild.id;
      const conf = settings[guildId]?.logs;
    
      if (conf?.enabled && conf.categories.mod && conf.channel) {
        const logChannel = guild.channels.cache.get(conf.channel);
        if (logChannel) {
          logChannel.send({
            embeds: [{
              title: `⚠️ Sanction : ${action}`,
              fields: [
                { name: 'Membre', value: `${user.tag}`, inline: true },
                { name: 'Modérateur', value: `${moderator.tag}`, inline: true },
                { name: 'Raison', value: reason || 'Non spécifiée' }
              ],
              color: 0xffa500,
              timestamp: new Date()
            }]
          });
        }
      }
    }
    // Log the moderation action
    logModerationAction(interaction.guild, target.user, 'Ban', reason, interaction.user);
    
  }
};
