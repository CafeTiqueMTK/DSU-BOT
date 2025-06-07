const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription("Envoie un message privé à un utilisateur.")
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L’utilisateur à qui envoyer le message')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message à envoyer')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const message = interaction.options.getString('message');

    try {
      await user.send(message);
      await interaction.reply({ content: `📩 Message envoyé à ${user.tag}.`, ephemeral: true });
    } catch (error) {
      console.error(`Erreur lors de l'envoi de DM à ${user.tag}:`, error);
      await interaction.reply({ content: `❌ Impossible d’envoyer un message à ${user.tag}.`, ephemeral: true });
    }
  }
};
// This code defines a Discord bot command that allows users to send direct messages (DMs) to other users.
// The command is structured using the SlashCommandBuilder from the discord.js library.