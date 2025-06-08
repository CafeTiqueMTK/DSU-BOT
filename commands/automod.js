// Fichier : commands/automod.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = './settings.json';
const automodActionsPath = path.join(__dirname, '../automod_actions.json');

module.exports = {
  data: new SlashCommandBuilder()
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
        ))
      .addIntegerOption(opt =>
        opt.setName('duree')
          .setDescription('Durée du mute en minutes (uniquement pour mute)')
          .setRequired(false)
      )
    )
    .addSubcommandGroup(group =>
      group.setName('ignorerole')
        .setDescription('Gérer les rôles ignorés par l\'automod')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Ajouter un rôle à ignorer')
            .addRoleOption(opt =>
              opt.setName('role')
                .setDescription('Rôle à ignorer')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Retirer un rôle de la liste des ignorés')
            .addRoleOption(opt =>
              opt.setName('role')
                .setDescription('Rôle à ne plus ignorer')
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group.setName('ignorechannel')
        .setDescription('Gérer les salons ignorés par l\'automod')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Ajouter un salon à ignorer')
            .addChannelOption(opt =>
              opt.setName('salon')
                .setDescription('Salon à ignorer')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Retirer un salon de la liste des ignorés')
            .addChannelOption(opt =>
              opt.setName('salon')
                .setDescription('Salon à ne plus ignorer')
                .setRequired(true)
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('listmod')
        .setDescription('Voir l\'historique automod d\'un utilisateur')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Utilisateur à consulter')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('clearmod')
        .setDescription('Effacer l\'historique automod d\'un utilisateur')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Utilisateur à effacer')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Définir le salon où les actions automod seront envoyées')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Salon à utiliser pour les notifications automod')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Réinitialiser la configuration de l\'automod')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
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
    if (!settingsObj[guildId].automod.ignoredChannels) settingsObj[guildId].automod.ignoredChannels = [];

    const automod = settingsObj[guildId].automod;

    if (sub === 'reset') {
      settingsObj[guildId].automod = {
        enabled: false,
        categories: {},
        ignoredRoles: [],
        ignoredChannels: [],
        actionChannel: null
      };
      fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2));
      await interaction.reply({ content: '♻️ La configuration de l\'automod a été réinitialisée.', ephemeral: true });
      return;
    } else if (sub === 'enable') {
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
      const duree = interaction.options.getInteger('duree');
      if (!automod.categories[nom]) automod.categories[nom] = {};
      automod.categories[nom].sanction = sanction;
      if (sanction === 'mute') {
        automod.categories[nom].duree = duree || 10;
      } else {
        delete automod.categories[nom].duree;
      }
      await interaction.reply(`⚠️ Sanction de **${nom}** définie sur **${sanction}**.` + (sanction === 'mute' ? ` (Durée : ${duree || 10} min)` : ''));
    } else if (sub === 'action') {
      const nom = interaction.options.getString('nom');
      const action = interaction.options.getString('action');
      if (!automod.categories[nom]) automod.categories[nom] = {};
      automod.categories[nom].action = action;
      await interaction.reply(`⚙️ Action de **${nom}** définie sur **${action}**.`);
    } else if (interaction.options.getSubcommandGroup?.() === 'ignorerole') {
      const subRole = interaction.options.getSubcommand();
      const role = interaction.options.getRole('role');
      const roleId = role.id;
      if (subRole === 'add') {
        if (!automod.ignoredRoles.includes(roleId)) {
          automod.ignoredRoles.push(roleId);
        }
        await interaction.reply(`✅ Le rôle <@&${roleId}> est maintenant ignoré par l'automod.`);
      } else if (subRole === 'remove') {
        automod.ignoredRoles = automod.ignoredRoles.filter(r => r !== roleId);
        await interaction.reply(`❌ Le rôle <@&${roleId}> n'est plus ignoré par l'automod.`);
      }
    } else if (interaction.options.getSubcommandGroup?.() === 'ignorechannel') {
      const subChan = interaction.options.getSubcommand();
      const channel = interaction.options.getChannel('salon');
      const channelId = channel.id;
      if (!automod.ignoredChannels) automod.ignoredChannels = [];
      if (subChan === 'add') {
        if (!automod.ignoredChannels.includes(channelId)) {
          automod.ignoredChannels.push(channelId);
        }
        await interaction.reply(`✅ Le salon <#${channelId}> est maintenant ignoré par l'automod.`);
      } else if (subChan === 'remove') {
        automod.ignoredChannels = automod.ignoredChannels.filter(c => c !== channelId);
        await interaction.reply(`❌ Le salon <#${channelId}> n'est plus ignoré par l'automod.`);
      }
    } else if (sub === 'listmod') {
      const user = interaction.options.getUser('user');
      let actions = {};
      if (fs.existsSync(automodActionsPath)) {
        actions = JSON.parse(fs.readFileSync(automodActionsPath, 'utf-8'));
      }
      const logs = actions[interaction.guild.id]?.[user.id] || [];
      if (logs.length === 0) {
        await interaction.reply(`Aucune action automod enregistrée pour ${user.tag}.`);
      } else {
        const desc = logs.map(a =>
          `• [${new Date(a.date).toLocaleString()}] **${a.sanction}** : ${a.reason}`
        ).join('\n');
        await interaction.reply({
          embeds: [{
            title: `Historique automod pour ${user.tag}`,
            description: desc,
            color: 0xffa500
          }]
        });
      }
      return;
    } else if (sub === 'clearmod') {
      const user = interaction.options.getUser('user');
      let actions = {};
      if (fs.existsSync(automodActionsPath)) {
        actions = JSON.parse(fs.readFileSync(automodActionsPath, 'utf-8'));
      }
      if (actions[interaction.guild.id] && actions[interaction.guild.id][user.id]) {
        delete actions[interaction.guild.id][user.id];
        fs.writeFileSync(automodActionsPath, JSON.stringify(actions, null, 2));
        await interaction.reply(`L'historique automod de ${user.tag} a été effacé.`);
      } else {
        await interaction.reply(`Aucun historique automod à effacer pour ${user.tag}.`);
      }
      return;
    } else if (sub === 'setchannel') {
      const salon = interaction.options.getChannel('salon');
      automod.actionChannel = salon.id;
      fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2));
      await interaction.reply({ content: `Salon d'actions automod défini sur <#${salon.id}>.`, ephemeral: true });
      return;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2));
  }
};

