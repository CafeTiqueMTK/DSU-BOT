const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { readFileSync, promises: { readFile } } = require('fs');

// Charger config.json
console.log('Loading config.json...');
const configRaw = fs.readFileSync('./config.json', 'utf-8');
const config = JSON.parse(configRaw);

// Créer le client
console.log('Creating Discord client...');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// Charger les commandes
console.log('Loading commands...');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // .js au lieu de .mjs

const commandsArray = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commandsArray.push(command.data.toJSON());
  console.log(`Loaded command: ${command.data.name}`);
}

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

  const guildId = message.guild.id;
  const guildSettings = settings[guildId]?.automod;

  if (!guildSettings?.enabled) return;

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
    await message.delete();
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
    await message.delete();
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
        await message.delete();
        console.log(`Deleted message for bad word: ${found}`);
        await applySanction(guildSettings.categories.badWords.sanction, `Forbidden word: ${found}`);
      }
    }
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
  const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const conf = settings[guildId]?.logs;
  if (!conf?.enabled || !conf.categories.vocal || !conf.channel) return;

  const channel = newState.guild.channels.cache.get(conf.channel);
  if (!channel) return;

  if (!oldState.channel && newState.channel) {
    channel.send(`🔊 ${newState.member.user.tag} joined ${newState.channel.name}`);
    console.log(`${newState.member.user.tag} joined voice channel ${newState.channel.name}`);
  } else if (oldState.channel && !newState.channel) {
    channel.send(`🔇 ${oldState.member.user.tag} left ${oldState.channel.name}`);
    console.log(`${oldState.member.user.tag} left voice channel ${oldState.channel.name}`);
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
    }
  }
}

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

