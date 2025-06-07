const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Affiche le statut du bot.'),

  async execute(interaction) {
    const uptime = process.uptime(); // en secondes
    const totalSeconds = Math.floor(uptime);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const embed = new EmbedBuilder()
      .setTitle('📊 Statut du Bot')
      .setColor('#00BFFF')
      .addFields(
        { name: '🔌 Ping', value: `${interaction.client.ws.ping} ms`, inline: true },
        { name: '📡 Uptime', value: `${days}j ${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: '👥 Utilisateurs', value: `${interaction.client.users.cache.size}`, inline: true },
        { name: '🛡️ Serveurs', value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: '📶 Statut', value: `${interaction.client.presence?.status || 'Inconnu'}`, inline: true },
        { name: '⚙️ Version', value: `Node.js ${process.version}\nDiscord.js v${require('discord.js').version}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `Bot actif sur ${os.hostname()}` });

    await interaction.reply({ embeds: [embed] });
  }
};
