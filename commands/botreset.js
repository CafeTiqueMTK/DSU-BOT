const { SlashCommandBuilder, PermissionFlagsBits, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botreset')
    .setDescription('Réinitialise complètement la configuration du bot (attention, irréversible)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Demande de confirmation non éphémère
    await interaction.reply({
      content: '⚠️ Cette action va **réinitialiser TOUTES les données du bot**. Pour confirmer, tapez `YES` dans ce salon.',
      ephemeral: false
    });

    // Collecte la réponse de l'utilisateur
    const filter = m => m.author.id === interaction.user.id;
    const channel = interaction.channel;
    try {
      const collected = await channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ['time']
      });
      const response = collected.first();
      if (response.content.trim().toUpperCase() === 'YES') {
        const settingsPath = path.join(__dirname, '../settings.json');
        const automodActionsPath = path.join(__dirname, '../automod_actions.json');
        const warnsPath = path.join(__dirname, '../warns.json');
        fs.writeFileSync(settingsPath, '{}');
        fs.writeFileSync(automodActionsPath, '{}');
        if (fs.existsSync(warnsPath)) fs.writeFileSync(warnsPath, '{}');
        await interaction.followUp({
          content: '♻️ Toutes les données du bot ont été réinitialisées.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ Réinitialisation annulée.',
          ephemeral: true
        });
      }
      // Supprime la réponse de confirmation de l'utilisateur pour garder le salon propre
      await response.delete().catch(() => {});
    } catch {
      await interaction.followUp({
        content: '⏱️ Temps écoulé. Réinitialisation annulée.',
        ephemeral: true
      });
    }
  }
};
