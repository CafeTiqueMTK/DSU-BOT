const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gayrater')
    .setDescription('Évalue à quel point un utilisateur est gay')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à évaluer')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const pourcentage = Math.floor(Math.random() * 101); // 0 à 100

    const embed = new EmbedBuilder()
      .setTitle('🌈 Gayrater 3000')
      .setDescription(`**${user.username}** est gay à **${pourcentage}%** ! 😄`)
      .setColor(0xff69b4)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Juste pour rire ❤️' });

    await interaction.reply({ embeds: [embed] });
  }
};
// Note: This command is meant for fun and should not be taken seriously. Always be respectful and considerate of others' feelings.
// Make sure to inform users that this command is just for entertainment purposes and not to be taken seriously.