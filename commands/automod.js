// Fichier : commands/automod.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = path.resolve('./settings.json');

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
      )))
  .addSubcommand(sub =>
    sub.setName('ignore')
      .setDescription('Ajouter ou retirer un rôle ignoré par l\'automod')
      .addRoleOption(opt =>
        opt.setName('role')
          .setDescription('Rôle à ignorer')
          .setRequired(true)
      )
      .addBooleanOption(opt =>
        opt.setName('remove')
          .setDescription('Retirer le rôle de la liste des ignorés')
          .setRequired(false)
      )
  );

async function execute(interaction) {
  const guildId = interaction.guild.id;
  const sub = interaction.options.getSubcommand();
  // Toujours recharger settings
  let settingsObj;
  try {
    settingsObj = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    settingsObj = {};
  }
  if (!settingsObj[guildId]) settingsObj[guildId] = {};
  if (!settingsObj[guildId].automod) settingsObj[guildId].automod = { enabled: false, categories: {} };
  if (!settingsObj[guildId].automod.categories) settingsObj[guildId].automod.categories = {};
  if (!settingsObj[guildId].automod.ignoredRoles) settingsObj[guildId].automod.ignoredRoles = [];

  const automod = settingsObj[guildId].automod;

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
  } else if (sub === 'ignore') {
    const role = interaction.options.getRole('role');
    const remove = interaction.options.getBoolean('remove') || false;
    const roleId = role.id;
    if (remove) {
      automod.ignoredRoles = automod.ignoredRoles.filter(r => r !== roleId);
      await interaction.reply(`❌ Le rôle <@&${roleId}> n'est plus ignoré par l'automod.`);
    } else {
      if (!automod.ignoredRoles.includes(roleId)) {
        automod.ignoredRoles.push(roleId);
      }
      await interaction.reply(`✅ Le rôle <@&${roleId}> est maintenant ignoré par l'automod.`);
    }
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2));
}

module.exports = { data, execute };

