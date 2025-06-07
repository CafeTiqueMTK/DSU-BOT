const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertit un membre et enregistre l\'avertissement')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de l\'avertissement')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
    const moderator = interaction.user;
    const guildId = interaction.guild.id;

    // Chemin vers warns.json
    const warnsPath = path.join(__dirname, '../warns.json');
    let warnsData = {};

    // Charger ou créer warns.json
    if (fs.existsSync(warnsPath)) {
      warnsData = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
    }

    // Initialiser les données si besoin
    if (!warnsData[guildId]) warnsData[guildId] = {};
    if (!warnsData[guildId][target.id]) warnsData[guildId][target.id] = [];

    // Ajouter l’avertissement
    warnsData[guildId][target.id].push({
      moderator: `${moderator.tag}`,
      reason: reason,
      date: new Date().toLocaleString()
    });

    // Sauvegarder dans le fichier
    fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

    // DM à l’utilisateur averti
    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Vous avez reçu un avertissement')
            .setColor(0xff9900)
            .addFields(
              { name: 'Serveur', value: interaction.guild.name },
              { name: 'Raison', value: reason },
              { name: 'Modérateur', value: moderator.tag }
            )
            .setTimestamp()
        ]
      });
    } catch (err) {
      // Si DM échoue
    }

    // Confirmation dans le salon
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Avertissement donné')
          .setColor(0xffcc00)
          .addFields(
            { name: 'Membre', value: target.tag, inline: true },
            { name: 'Modérateur', value: moderator.tag, inline: true },
            { name: 'Raison', value: reason }
          )
          .setTimestamp()
      ]
    });

    // Log la sanction dans le salon de logs si configuré
    // Correction : importer la fonction logModerationAction depuis le fichier principal si possible
    // Sinon, utilisez le pattern suivant pour accéder à la fonction globale
    try {
      if (typeof logModerationAction === 'function') {
        logModerationAction(interaction.guild, target, 'warn', reason, moderator);
      } else if (interaction.client && typeof interaction.client.logModerationAction === 'function') {
        interaction.client.logModerationAction(interaction.guild, target, 'warn', reason, moderator);
      }
    } catch (err) {
      // Logging failed, ignore
    }
  }
};