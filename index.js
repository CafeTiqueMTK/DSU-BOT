const { Client, GatewayIntentBits, Collection, Events, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { readFileSync, promises: { readFile } } = require('fs');
const fetch = require('node-fetch'); // Assurez-vous d'avoir installé node-fetch v2 ou v3

// Charger config.json
console.log('Loading config.json...');
const configRaw = fs.readFileSync('./config.json', 'utf-8');
const config = JSON.parse(configRaw);

// Créer le client
console.log('Creating Discord client...');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates // Ajout de l'intent pour les logs vocaux
  ]
});

client.commands = new Collection();

// Fonction utilitaire pour charger les commandes
function loadCommands(client, commandsPath) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const commandsArray = [];
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commandsArray.push(command.data.toJSON());
    console.log(`Loaded command: ${command.data.name}`);
  }
  return commandsArray;
}

// Charger les commandes
console.log('Loading commands...');
const commandsPath = path.join(__dirname, 'commands');
const commandsArray = loadCommands(client, commandsPath);

// Charger settings.json
console.log('Loading settings.json...');
const settingsPath = path.join(__dirname, 'settings.json');
const settingsRaw = fs.readFileSync(settingsPath, 'utf-8');
const settings = JSON.parse(settingsRaw);

// Déployer les commandes
const rest = new REST({ version: '10' }).setToken(config.token);

async function deployCommands() {
  try {
    console.log('Deploying commands to Discord API...');
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandsArray,
    });
    console.log('Commands deployed successfully.');
    // Ajout d'un log pour indiquer que la connexion va commencer après le déploiement
    console.log('If you do not see the bot online, check your bot token and permissions.');
  } catch (error) {
    console.error('Error while deploying commands:', error);
  }
}
deployCommands();

// Ajoutez ceci juste avant ou après deployCommands() pour lancer la connexion du bot :
client.login(config.token);

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`Received interaction: ${interaction.commandName}`);
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.log('Command not found.');
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`Executed command: ${interaction.commandName}`);
  } catch (error) {
    console.error('Error during command execution:', error);
    await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
  }
});

// Message handler (automod)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // Log message received
  console.log(`Message received from ${message.author.tag}: ${message.content}`);

  // Recharge settings à chaque message pour éviter le cache
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  } catch {
    settings = {};
  }
  const guildSettings = settings[message.guild.id]?.automod;

  if (!guildSettings?.enabled) return;

  // --- Ignorer les rôles configurés ---
  const ignoredRoles = guildSettings.ignoredRoles || [];
  if (ignoredRoles.length > 0 && message.member.roles.cache.some(r => ignoredRoles.includes(r.id))) {
    // console.log(`Automod ignored for ${message.author.tag} (ignored role)`);
    return;
  }
  // --- Fin ajout ---

  const member = message.member;

  const applySanction = async (sanction, reason) => {
    try {
      await message.author.send({
        embeds: [{
          title: 'Sanction Automod',
          description: `Tu as été sanctionné pour : **${reason}**\nMerci de respecter les règles du serveur.`,
          color: 0xff0000
        }]
      });
      console.log(`Sent sanction DM to ${message.author.tag}`);
    } catch (e) {
      console.warn(`Could not send DM to ${message.author.tag}`);
    }

    switch (sanction) {
      case 'warn':
        await message.channel.send(`⚠️ <@${message.author.id}> has been warned for **${reason}**.`);
        console.log(`Warned ${message.author.tag} for: ${reason}`);
        // Ajout du warn dans warns.json et log modération
        if (client.logModerationAction) {
          client.logModerationAction(message.guild, message.author, 'warn', reason, message.client.user);
        }
        break;
      case 'kick':
        await member.kick(reason);
        console.log(`Kicked ${message.author.tag} for: ${reason}`);
        break;
      case 'ban':
        await member.ban({ reason });
        console.log(`Banned ${message.author.tag} for: ${reason}`);
        break;
      case 'mute':
        const muteRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'mute');
        if (muteRole) {
          await member.roles.add(muteRole, reason);
          console.log(`Muted ${message.author.tag} for: ${reason}`);
        } else {
          await message.channel.send('🔇 Mute role not found.');
          console.log('Mute role not found.');
        }
        break;
    }
  };

  // 🔗 Discord link
  if (guildSettings.categories?.discordLink?.enabled && /discord\.gg\/\w+/i.test(message.content)) {
    await message.delete().catch(e => console.warn('Failed to delete discord link message:', e));
    console.log('Deleted message containing Discord invite link.');
    await applySanction(guildSettings.categories.discordLink.sanction, 'Discord link not allowed');
  }

  // 👻 Ghost ping
  if (guildSettings.categories?.ghostPing?.enabled && message.mentions.users.size > 0 && message.type === 0 && message.content.trim() === '') {
    console.log('Detected ghost ping.');
    await applySanction(guildSettings.categories.ghostPing.sanction, 'Ghost ping');
  }

  // 📣 Mention spam
  if (guildSettings.categories?.mentionSpam?.enabled && message.mentions.users.size >= 5) {
    await message.delete().catch(e => console.warn('Failed to delete mention spam message:', e));
    console.log('Deleted message for mention spam.');
    await applySanction(guildSettings.categories.mentionSpam.sanction, 'Mention spam');
  }

  // 💬 Soft spam
  if (guildSettings.categories?.spam?.enabled) {
    const now = Date.now();
    if (!client.spamMap) client.spamMap = new Map();

    const userData = client.spamMap.get(message.author.id) || { count: 0, last: now };
    const timeDiff = now - userData.last;

    if (timeDiff < 15000) {
      userData.count += 1;
    } else {
      userData.count = 1;
    }
    userData.last = now;
    client.spamMap.set(message.author.id, userData);

    if (userData.count > 10) {
      console.log(`Detected spam from ${message.author.tag}`);
      await applySanction(guildSettings.categories.spam.sanction, 'Message spam');
      client.spamMap.set(message.author.id, { count: 0, last: now });
    }
  }

  // ❌ Bad words
  if (guildSettings.categories?.badWords?.enabled) {
    const badWordsPath = './bannedWords.json';
    if (fs.existsSync(badWordsPath)) {
      const words = JSON.parse(fs.readFileSync(badWordsPath, 'utf-8'));
      const lower = message.content.toLowerCase();
      const found = words.find(w => lower.includes(w));
      if (found) {
        await message.delete().catch(e => console.warn('Failed to delete bad word message:', e));
        console.log(`Deleted message for bad word: ${found}`);
        await applySanction(guildSettings.categories.badWords.sanction, `Forbidden word: ${found}`);

        // Ajout automatique du warn dans warns.json
        if (guildSettings.categories.badWords.sanction === 'warn') {
          const warnsPath = path.join(__dirname, 'warns.json');
          let warnsData = {};
          if (fs.existsSync(warnsPath)) {
            warnsData = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
          }
          if (!warnsData[guildId]) warnsData[guildId] = {};
          if (!warnsData[guildId][message.author.id]) warnsData[guildId][message.author.id] = [];
          warnsData[guildId][message.author.id].push({
            moderator: 'Automod',
            reason: `Forbidden word: ${found}`,
            date: new Date().toLocaleString()
          });
          fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));
          console.log(`Warn added to warns.json for ${message.author.tag}`);
        }
      }
    }
  }

  // --- Système de traduction automatique ---
  try {
    // Recharge settings à chaque message
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
    } catch {
      settings = {};
    }
    const guildSettings = settings[message.guild.id]?.translation;
    if (
      guildSettings &&
      guildSettings.enabled &&
      guildSettings.source &&
      guildSettings.target &&
      !message.author.bot
    ) {
      // Ne traduit pas les messages déjà traduits par le bot
      if (message.webhookId || message.author.id === client.user.id) return;

      // Appel à l'API libretranslate
      const apiUrl = 'https://libretranslate.de/translate';
      const body = {
        q: message.content,
        source: guildSettings.source,
        target: guildSettings.target,
        format: 'text'
      };

      // Ne traduit pas si source et target sont identiques
      if (guildSettings.source === guildSettings.target) return;

      // Optionnel : ignore les messages trop courts ou vides
      if (!message.content || message.content.length < 2) return;

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data && data.translatedText && data.translatedText !== message.content) {
          const embed = new EmbedBuilder()
            .setTitle('Message traduit')
            .setDescription(data.translatedText)
            .setColor(0x00bfff)
            .setFooter({ text: 'DSU translation system' });
          await message.reply({ embeds: [embed] });
        }
      } catch (err) {
        console.warn('Translation API error:', err);
      }
    }
  } catch (err) {
    // Ignore translation errors
  }

  // --- Système de niveaux ---
  try {
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
    } catch {
      settings = {};
    }
    const guildId = message.guild.id;
    const levelConf = settings[guildId]?.level;
    if (levelConf && levelConf.enabled) {
      if (!levelConf.users) levelConf.users = {};
      let userData = levelConf.users[message.author.id];
      if (!userData) userData = levelConf.users[message.author.id] = { xp: 0, level: 1 };

      // Calcul du multiplicateur de rôle booster
      let multiplier = 1;
      if (levelConf.boosters && message.member) {
        for (const [roleId, mult] of Object.entries(levelConf.boosters)) {
          if (message.member.roles.cache.has(roleId)) {
            multiplier = Math.max(multiplier, mult);
          }
        }
      }

      // XP de base par message
      const baseXp = 10;
      const xpGain = baseXp * multiplier;
      userData.xp += xpGain;

      // Fonction pour calculer l'xp nécessaire pour le prochain niveau (progression exponentielle)
      function xpForLevel(level) {
        return 100 * Math.pow(1.25, level - 1);
      }

      // Passage de niveau
      let leveledUp = false;
      while (userData.xp >= xpForLevel(userData.level)) {
        userData.xp -= xpForLevel(userData.level);
        userData.level += 1;
        leveledUp = true;
      }

      if (leveledUp && levelConf.channel) {
        const channel = message.guild.channels.cache.get(levelConf.channel);
        if (channel) {
          channel.send({
            embeds: [{
              title: '🎉 Nouveau niveau !',
              description: `<@${message.author.id}> vient de passer au niveau **${userData.level}** !`,
              color: 0x00ff99,
              footer: { text: 'DSU level system' },
              timestamp: new Date()
            }]
          });
        }
      }

      // Sauvegarde
      settings[guildId].level = levelConf;
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
    }
  } catch (err) {
    console.warn('Level system error:', err);
  }
});

client.on('guildMemberAdd', async (member) => {
  console.log(`New member joined: ${member.user.tag}`);
  const guildId = member.guild.id;
  const settingsPath = path.join(__dirname, 'settings.json');

  if (!fs.existsSync(settingsPath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const autorole = settings[guildId]?.autorole;

  if (autorole?.enabled && autorole.roleId) {
    const role = member.guild.roles.cache.get(autorole.roleId);
    if (role) {
      try {
        await member.roles.add(role);
        console.log(`Role ${role.name} assigned to ${member.user.tag}`);
      } catch (err) {
        console.error(`Failed to assign role to ${member.user.tag}`, err);
      }
    }
  }
});

client.on('guildMemberAdd', member => {
  const guildId = member.guild.id;
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

  const conf = settings[guildId]?.logs;
  if (conf?.enabled && conf.categories.arrived && conf.channel) {
    const channel = member.guild.channels.cache.get(conf.channel);
    if (channel) {
      channel.send(`👋 ${member.user.tag} joined the server.`);
      console.log(`Sent welcome log for ${member.user.tag}`);
    }
  }
});
client.on('guildMemberRemove', member => {
  const guildId = member.guild.id;
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

  const conf = settings[guildId]?.logs;
  if (conf?.enabled && conf.categories.farewell && conf.channel) {
    const channel = member.guild.channels.cache.get(conf.channel);
    if (channel) {
      channel.send(`👋 ${member.user.tag} left the server.`);
      console.log(`Sent farewell log for ${member.user.tag}`);
    }
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = newState.guild.id;
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  } catch {
    settings = {};
  }
  const conf = settings[guildId]?.logs;
  if (!conf?.enabled || !conf.categories?.vocal || !conf.channel) {
    console.log('Vocal log skipped: not enabled or misconfigured.');
    return;
  }

  const logChannel = newState.guild.channels.cache.get(conf.channel);
  if (!logChannel) {
    console.warn('Log channel not found or bot has no access.');
    return;
  }

  // Debug: log channel info and permissions
  console.log(`Log channel resolved: ${logChannel.id} (${logChannel.name})`);
  const permissions = logChannel.permissionsFor(newState.guild.members.me);
  if (!permissions) {
    console.warn('Could not resolve bot permissions in log channel.');
    return;
  }
  if (!permissions.has('ViewChannel')) {
    console.warn('Bot missing ViewChannel permission in log channel.');
    return;
  }
  if (!permissions.has('SendMessages')) {
    console.warn('Bot missing SendMessages permission in log channel.');
    return;
  }
  if (!permissions.has('EmbedLinks')) {
    console.warn('Bot missing EmbedLinks permission in log channel.');
    return;
  }

  // Debug: log event type
  if (!oldState.channel && newState.channel) {
    console.log('Detected voice join event');
  } else if (oldState.channel && !newState.channel) {
    console.log('Detected voice leave event');
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    console.log('Detected voice switch event');
  } else {
    console.log('No relevant voice event detected');
    return;
  }

  // Join event
  if (!oldState.channel && newState.channel) {
    logChannel.send({
      embeds: [{
        title: '🔊 Voice Channel Join',
        description: `${newState.member.user.tag} joined **${newState.channel.name}**`,
        color: 0x00bfff,
        timestamp: new Date()
      }]
    }).then(() => {
      console.log('Voice join log sent.');
    }).catch(e => console.error('Failed to send join log:', e));
  }
  // Leave event
  else if (oldState.channel && !newState.channel) {
    logChannel.send({
      embeds: [{
        title: '🔇 Voice Channel Leave',
        description: `${oldState.member.user.tag} left **${oldState.channel.name}**`,
        color: 0xff5555,
        timestamp: new Date()
      }]
    }).then(() => {
      console.log('Voice leave log sent.');
    }).catch(e => console.error('Failed to send leave log:', e));
  }
  // Switch event
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    logChannel.send({
      embeds: [{
        title: '🔄 Voice Channel Switch',
        description: `${newState.member.user.tag} switched from **${oldState.channel.name}** to **${newState.channel.name}**`,
        color: 0xffcc00,
        timestamp: new Date()
      }]
    }).then(() => {
      console.log('Voice switch log sent.');
    }).catch(e => console.error('Failed to send switch log:', e));
  }
});

// Fonction pour enregistrer les actions de modération
// Cette fonction est appelée après chaque action de modération (ban, kick, warn, mute)
function logModerationAction(guild, user, action, reason, moderator) {
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const guildId = guild.id;
  const conf = settings[guildId]?.logs;

  if (conf?.enabled && conf.categories.mod && conf.channel) {
    const logChannel = guild.channels.cache.get(conf.channel);
    if (logChannel) {
      logChannel.send({
        embeds: [{
          title: `⚠️ Sanction : ${action}`,
          fields: [
            { name: 'Membre', value: `${user.tag}`, inline: true },
            { name: 'Modérateur', value: `${moderator.tag}`, inline: true },
            { name: 'Raison', value: reason || 'Non spécifiée' }
          ],
          color: 0xffa500,
          timestamp: new Date()
        }]
      });
      console.log(`Logged moderation action: ${action} for ${user.tag}`);
    } else {
      console.warn('Log channel not found or bot has no access.');
    }
  } else {
    console.warn('Logging is disabled or misconfigured for this guild.');
  }
}

// Rendez la fonction accessible aux commandes
client.logModerationAction = logModerationAction;

// Gestion des événements de bienvenue
client.on('guildMemberAdd', async member => {
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const conf = settings[member.guild.id]?.welcome;

  if (conf?.enabled && conf.channel) {
    const channel = member.guild.channels.cache.get(conf.channel);
    if (channel) {
      channel.send({
        embeds: [{
          title: `👋 Welcome ${member.user.username}!`,
          description: `We are happy to welcome you to **${member.guild.name}**! 🎉`,
          thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
          color: 0x00ff99,
          footer: { text: `User ID: ${member.id}` },
          timestamp: new Date()
        }]
      });
      console.log(`Sent custom welcome embed for ${member.user.tag}`);
    }
  }
});

// Gestion des événements de départ
client.on('guildMemberRemove', async member => {
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const conf = settings[member.guild.id]?.farewell;

  if (conf?.enabled && conf.channel) {
    const channel = member.guild.channels.cache.get(conf.channel);
    if (channel) {
      channel.send({
        embeds: [{
          title: `😢 ${member.user.username} left the server`,
          description: `We hope to see you again on **${member.guild.name}**...`,
          thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
          color: 0xff5555,
          footer: { text: `User ID: ${member.id}` },
          timestamp: new Date()
        }]
      });
      console.log(`Sent custom farewell embed for ${member.user.tag}`);
    }
  }
});

console.log('All startup steps completed. Bot is now connecting to Discord...');

// Prêt
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is ready and logged in as ${client.user.tag}`);
  console.log('Bot is fully operational and listening for events.');
});

