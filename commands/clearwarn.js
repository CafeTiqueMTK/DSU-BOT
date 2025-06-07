const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription('Supprime tous les avertissements d’un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Utilisateur dont on veut supprimer les warns')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const guildId = interaction.guild.id;
    const warnsPath = path.join(__dirname, '../warns.json');

    if (!fs.existsSync(warnsPath)) {
      return interaction.reply({ content: '❌ Aucun avertissement trouvé.', ephemeral: true });
    }

    let warns = JSON.parse(fs.readFileSync(warnsPath, 'utf-8'));

    if (!warns[guildId] || !warns[guildId][user.id]) {
      return interaction.reply({ content: `❌ Aucun avertissement trouvé pour ${user.tag}.`, ephemeral: true });
    }

    delete warns[guildId][user.id];

    fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

    return interaction.reply({ content: `✅ Tous les avertissements de ${user.tag} ont été supprimés.` });
  }
};
