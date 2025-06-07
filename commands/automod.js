// Fichier : commands/automod.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settings = require('../settings.json');

const data = new SlashCommandBuilder()
  .setName('automod')
  .setDescription('Gère le système d\'automodération')
  .addSubcommand(sub => sub
    .setName('enable')
    .setDescription('Active le système d\'automodération'))
  .addSubcommand(sub => sub
    .setName('disable')
    .setDescription('Désactive le système d\'automodération'))
  .addSubcommand(sub => sub
    .setName('status')
    .setDescription('Affiche le statut de l\'automodération'))
  .addSubcommand(sub => sub
    .setName('category')
    .setDescription('Active ou désactive une catégorie')
    .addStringOption(opt => opt
      .setName('nom')
      .setDescription('Nom de la catégorie')
      .setRequired(true)
      .addChoices(
        { name: 'discordLink', value: 'discordLink' },
        { name: 'ghostPing', value: 'ghostPing' },
        { name: 'mentionSpam', value: 'mentionSpam' },
        { name: 'spam', value: 'spam' },
        { name: 'badWords', value: 'badWords' }
      ))
    .addBooleanOption(opt => opt
      .setName('etat')
      .setDescription('true = active, false = désactive')
      .setRequired(true)))
  .addSubcommand(sub => sub
    .setName('sanction')
    .setDescription('Définit la sanction pour une catégorie')
    .addStringOption(opt => opt
      .setName('nom')
      .setDescription('Nom de la catégorie')
      .setRequired(true)
      .addChoices(
        { name: 'discordLink', value: 'discordLink' },
        { name: 'ghostPing', value: 'ghostPing' },
        { name: 'mentionSpam', value: 'mentionSpam' },
        { name: 'spam', value: 'spam' },
        { name: 'badWords', value: 'badWords' }
      ))
    .addStringOption(opt => opt
      .setName('sanction')
      .setDescription('warn, mute, kick, ban')
      .setRequired(true)
      .addChoices(
        { name: 'warn', value: 'warn' },
        { name: 'mute', value: 'mute' },
        { name: 'kick', value: 'kick' },
        { name: 'ban', value: 'ban' }
      )));

async function execute(interaction) {
  const guildId = interaction.guild.id;
  const sub = interaction.options.getSubcommand();
  const filePath = path.resolve('./settings.json');

  if (!settings[guildId]) settings[guildId] = { automod: { enabled: false, categories: {} } };

  const automod = settings[guildId].automod;

  if (sub === 'enable') {
    automod.enabled = true;
    await interaction.reply('✅ Automod activé');
  } else if (sub === 'disable') {
    automod.enabled = false;
    await interaction.reply('❌ Automod désactivé');
  } else if (sub === 'status') {
    const status = Object.entries(automod.categories || {}).map(([key, val]) => `**${key}**: ${val.enabled ? '✅' : '❌'} - Sanction: ${val.sanction || 'Aucune'}`).join('\n');
    await interaction.reply(`🔎 **Statut de l'automod**:\nActivé: ${automod.enabled ? '✅' : '❌'}\n\n${status || 'Aucune catégorie configurée.'}`);
  } else if (sub === 'category') {
    const nom = interaction.options.getString('nom');
    const etat = interaction.options.getBoolean('etat');
    if (!automod.categories[nom]) automod.categories[nom] = {};
    automod.categories[nom].enabled = etat;
    await interaction.reply(`🔧 Catégorie **${nom}** ${etat ? 'activée' : 'désactivée'}.`);
  } else if (sub === 'sanction') {
    const nom = interaction.options.getString('nom');
    const sanction = interaction.options.getString('sanction');
    if (!automod.categories[nom]) automod.categories[nom] = {};
    automod.categories[nom].sanction = sanction;
    await interaction.reply(`⚠️ Sanction de **${nom}** définie sur **${sanction}**.`);
  }

  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
}

module.exports = { data, execute };

