const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Affiche des informations sur le bot.'),
  
  async execute(interaction) {
    const system = `${os.type()} ${os.arch()} (${os.platform()})`;

    const embed = new EmbedBuilder()
      .setTitle('À propos de DSU V2')
      .setDescription(`✨ **DSU V2** est un bot de modération complet, conçu pour gérer efficacement les serveurs Discord avec puissance et flexibilité.`)
      .addFields(
        { name: 'Créateur', value: '👤 ThM', inline: true },
        { name: 'Système', value: `💻 ${system}`, inline: true },
        { name: 'Langage', value: '🛠️ Node.js (discord.js)', inline: true }
      )
      .setFooter({ text: 'Merci d’utiliser DSU V2 !' })
      .setColor(0x00AEFF)
      .setThumbnail(interaction.client.user.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  }
};
// Note: This command provides basic information about the bot and its creator.
// Ensure to keep the information updated as the bot evolves or if there are changes in the creator or technology used.