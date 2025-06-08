const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoannounce')
    .setDescription('Annonce automatiquement les nouveaux posts TikTok d\'un compte')
    .addSubcommandGroup(group =>
      group.setName('account')
        .setDescription('Gérer les comptes TikTok à surveiller')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Ajouter un compte TikTok à surveiller')
            .addStringOption(opt =>
              opt.setName('url')
                .setDescription('URL du profil TikTok')
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Retirer un compte TikTok de la surveillance')
            .addStringOption(opt =>
              opt.setName('url')
                .setDescription('URL du profil TikTok')
                .setRequired(true)
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Définir le salon où seront envoyées les annonces')
        .addChannelOption(opt =>
          opt.setName('salon')
            .setDescription('Salon d\'annonce')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('enable')
        .setDescription('Activer l\'auto annonce TikTok')
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver l\'auto annonce TikTok')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Afficher le statut de l\'auto annonce TikTok')
    )
    .addSubcommand(sub =>
      sub.setName('test')
        .setDescription('Tester l\'envoi d\'une annonce TikTok')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      settings = {};
    }
    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].autoannounce) settings[guildId].autoannounce = {
      enabled: false,
      channel: null,
      accounts: []
    };
    const conf = settings[guildId].autoannounce;

    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup?.();

    if (group === 'account') {
      const url = interaction.options.getString('url');
      if (sub === 'add') {
        if (!conf.accounts.includes(url)) conf.accounts.push(url);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        await interaction.reply({ content: `✅ Compte ajouté à la surveillance : ${url}`, ephemeral: true });
      } else if (sub === 'remove') {
        conf.accounts = conf.accounts.filter(u => u !== url);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        await interaction.reply({ content: `❌ Compte retiré de la surveillance : ${url}`, ephemeral: true });
      }
      return;
    }

    if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('salon');
      conf.channel = channel.id;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.reply({ content: `Salon d'annonce défini sur <#${channel.id}>.`, ephemeral: true });
    } else if (sub === 'enable') {
      conf.enabled = true;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '✅ Auto annonce TikTok activée.', ephemeral: true });
    } else if (sub === 'disable') {
      conf.enabled = false;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.reply({ content: '❌ Auto annonce TikTok désactivée.', ephemeral: true });
    } else if (sub === 'status') {
      await interaction.reply({
        embeds: [{
          title: 'Statut de l\'auto annonce TikTok',
          fields: [
            { name: 'Statut', value: conf.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
            { name: 'Salon', value: conf.channel ? `<#${conf.channel}>` : 'Non défini', inline: true },
            { name: 'Comptes surveillés', value: conf.accounts.length > 0 ? conf.accounts.join('\n') : 'Aucun', inline: false }
          ],
          color: 0x00bfff
        }],
        ephemeral: true
      });
    } else if (sub === 'test') {
      const conf = settings[interaction.guild.id]?.autoannounce;
      if (!conf?.enabled || !conf.channel) {
        await interaction.reply({ content: '⚠️ Auto annonce TikTok désactivée ou salon non défini.', ephemeral: true });
        return;
      }
      const channel = interaction.guild.channels.cache.get(conf.channel);
      if (!channel) {
        await interaction.reply({ content: '⚠️ Salon d\'annonce introuvable.', ephemeral: true });
        return;
      }

      // Si au moins un compte est configuré, tente de récupérer la dernière vidéo réelle
      if (conf.accounts.length > 0) {
        const url = conf.accounts[0];
        const username = extractUsername(url);
        if (username) {
          const latest = await fetchLatestTikTok(username);
          if (latest && latest.id) {
            await channel.send({
              content: `**${username}** a posté sur TikTok : ${latest.url}`,
              embeds: [
                new EmbedBuilder()
                  .setTitle(latest.title)
                  .setDescription(latest.desc)
                  .setURL(latest.url)
                  .setColor(0x010101)
                  .setFooter({ text: `TikTok • ${new Date(latest.date).toLocaleString()}` })
                  .setTimestamp(new Date(latest.date))
              ]
            });
            await interaction.reply({ content: `✅ Message de test envoyé avec la dernière vidéo de @${username}.`, ephemeral: true });
            return;
          }
        }
      }

      // Sinon, fallback sur un message factice
      await channel.send({
        content: `**tiktokuser** a posté sur TikTok : https://www.tiktok.com/@tiktokuser/video/1234567890`,
        embeds: [
          new EmbedBuilder()
            .setTitle('Titre factice du post TikTok')
            .setDescription('Ceci est une fausse annonce de test TikTok.')
            .setURL('https://www.tiktok.com/@tiktokuser/video/1234567890')
            .setColor(0x010101)
            .setFooter({ text: 'TikTok • Test automatique' })
            .setTimestamp(new Date())
        ]
      });
      await interaction.reply({ content: '✅ Message de test envoyé (mode factice).', ephemeral: true });
      return;
    }
  }
};

// ---
// Pour la partie "quand la personne poste un nouveau TikTok" :
// Il faudra un système externe (cron ou event) qui détecte les nouveaux posts TikTok pour chaque URL surveillée.
// Quand un nouveau post est détecté :
// 1. Récupérer le nom du compte, le titre du post, la description, le lien du post.
// 2. Envoyer dans le salon configuré :
//    - Message : "**NomDuCompte** a posté sur TikTok : <lien du post>"
//    - Embed : titre = titre du post, description = description du post, footer = "TikTok • Date du post" ou "ID du post" ou "Surveillance automatique"
// ---

// Ajout du système de détection automatique des nouveaux TikToks
const fetch = require('node-fetch');
const TIKTOK_CACHE_PATH = path.join(__dirname, '../tiktok_cache.json');

// Fonction utilitaire pour extraire le nom d'utilisateur depuis une URL TikTok
function extractUsername(url) {
  const match = url.match(/tiktok\.com\/@([^\/\?\s]+)/i);
  return match ? match[1] : null;
}

// Fonction pour récupérer les derniers posts d'un compte TikTok via l'API tikwm.com
async function fetchLatestTikTok(username) {
  // Utilise l'API publique de tikwm.com (pas besoin de clé pour les requêtes simples)
  // Voir https://tikwm.com/api/
  try {
    const res = await fetch(`https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(username)}&count=1`);
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const post = data.data[0];
      return {
        id: post.id,
        title: post.title || `Nouveau TikTok de ${username}`,
        desc: post.desc || '',
        url: `https://www.tiktok.com/@${username}/video/${post.id}`,
        date: post.create_time ? new Date(post.create_time * 1000).toISOString() : new Date().toISOString()
      };
    }
  } catch (e) {
    // fallback: retourne null si erreur
    return null;
  }
  return null;
}

// Fonction pour charger le cache des derniers posts connus
function loadTikTokCache() {
  if (fs.existsSync(TIKTOK_CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(TIKTOK_CACHE_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Fonction pour sauvegarder le cache
function saveTikTokCache(cache) {
  fs.writeFileSync(TIKTOK_CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Tâche périodique pour vérifier les nouveaux TikToks
async function checkNewTikToks(client) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const cache = loadTikTokCache();

  for (const guildId in settings) {
    const conf = settings[guildId]?.autoannounce;
    if (!conf?.enabled || !conf.channel || !conf.accounts?.length) continue;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    const channel = guild.channels.cache.get(conf.channel);
    if (!channel) continue;

    for (const url of conf.accounts) {
      const username = extractUsername(url);
      if (!username) continue;

      // Récupère le dernier post TikTok
      let latest;
      try {
        latest = await fetchLatestTikTok(username);
      } catch {
        continue;
      }
      if (!latest || !latest.id) continue;

      // Vérifie si ce post a déjà été annoncé
      if (!cache[guildId]) cache[guildId] = {};
      if (!cache[guildId][username]) cache[guildId][username] = null;

      if (cache[guildId][username] !== latest.id) {
        // Nouveau post détecté
        await channel.send({
          content: `**${username}** a posté sur TikTok : ${latest.url}`,
          embeds: [
            new EmbedBuilder()
              .setTitle(latest.title)
              .setDescription(latest.desc)
              .setURL(latest.url)
              .setColor(0x010101)
              .setFooter({ text: `TikTok • ${new Date(latest.date).toLocaleString()}` })
              .setTimestamp(new Date(latest.date))
          ]
        });
        cache[guildId][username] = latest.id;
      }
    }
  }
  saveTikTokCache(cache);
}

// Lancer la tâche périodique toutes les 5 minutes
let tiktokIntervalStarted = false;
module.exports.initAutoAnnounce = function(client) {
  if (tiktokIntervalStarted) return;
  tiktokIntervalStarted = true;
  setInterval(() => checkNewTikToks(client), 5 * 60 * 1000);
};
