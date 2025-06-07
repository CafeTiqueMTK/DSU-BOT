const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewwarn')
    .setDescription('Affiche les avertissements d’un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Utilisateur dont on veut voir les warns')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const guildId = interaction.guild.id;
    const warnsPath = path.join(__dirname, '../warns.json');

    if (!fs.existsSync(warnsPath)) {
      return interaction.reply({ content: '❌ Aucun avertissement enregistré.', ephemeral: true });
    }

    const warns = JSON.parse(fs.readFileSync(warnsPath, 'utf-8'));

    const userWarns = warns[guildId]?.[user.id];

    if (!userWarns || userWarns.length === 0) {
      return interaction.reply({ content: `✅ ${user.tag} n’a aucun avertissement.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📄 Avertissements de ${user.tag}`)
      .setColor(0xffcc00)
      .setFooter({ text: `Total : ${userWarns.length} avertissement(s)` });

    userWarns.forEach((warn, index) => {
      embed.addFields({
        name: `⚠️ Warn #${index + 1}`,
        value: `**Modérateur :** ${warn.moderator}\n**Raison :** ${warn.reason}\n**Date :** ${warn.date}`,
      });
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
