const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong et affiche la latence'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong ! (${latency}ms)`);
  }
};
// This command responds with "Pong" and displays the latency of the interaction.
// It uses the `SlashCommandBuilder` to define the command and its description.