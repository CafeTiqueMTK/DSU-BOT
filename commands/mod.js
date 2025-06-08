const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Commandes de modération (ban, kick, warn, mute)')
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Bannir un utilisateur')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Utilisateur à bannir')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('raison')
            .setDescription('Raison du ban')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Expulser un utilisateur')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Utilisateur à expulser')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('raison')
            .setDescription('Raison du kick')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Avertir un utilisateur')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Utilisateur à avertir')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('raison')
            .setDescription('Raison du warn')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Mute un utilisateur')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Utilisateur à mute')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('duree')
            .setDescription('Durée du mute en minutes (laisser vide pour 10 minutes)')
            .setMinValue(1) // Minimum 1 minute
            .setMaxValue(1440) // Maximum 24 heures (1440 minutes) 
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('raison')
            .setDescription('Raison du mute')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    // --- Vérification du rôle modérateur personnalisé ---
    let allow = false;
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const guildId = interaction.guild.id;
      const moderatorRoleId = settings[guildId]?.moderatorRole;
      if (moderatorRoleId) {
        if (interaction.member.roles.cache.has(moderatorRoleId)) {
          allow = true;
        }
      }
    } catch {}
    // Si pas de rôle défini, fallback sur permissions natives
    if (!allow && !interaction.member.permissions.has(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers)) {
      await interaction.reply({ content: 'Permission refusée. Seuls les modérateurs peuvent utiliser cette commande.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
    let duree = interaction.options.getInteger('duree');
    if (sub === 'mute') {
      if (!duree || duree <= 0) duree = 10;
    }
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Utilisateur introuvable sur ce serveur.', ephemeral: true });
      return;
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      await interaction.reply({ content: 'Permission refusée.', ephemeral: true });
      return;
    }

    if (sub === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: 'Permission refusée pour bannir.', ephemeral: true });
        return;
      }
      // DM l'utilisateur avec embed
      try {
        const embed = new EmbedBuilder()
          .setTitle('⛔ Bannissement')
          .setDescription(`Tu as été banni du serveur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
          .setColor(0x8B0000)
          .setTimestamp();
        await user.send({ embeds: [embed] });
      } catch {}
      await member.ban({ reason }).catch(() => {});
      await interaction.reply({ content: `🔨 ${user.tag} banni. Raison : ${reason}`, ephemeral: true });

      // Logging modération
      try {
        const fs = require('fs');
        const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
        const conf = settings[interaction.guild.id]?.logs;
        if (conf?.enabled && conf.categories?.mod && conf.channel) {
          const logChannel = interaction.guild.channels.cache.get(conf.channel);
          if (logChannel) {
            logChannel.send({
              embeds: [{
                title: `⚠️ Sanction : Ban`,
                fields: [
                  { name: 'Membre', value: `${user.tag}`, inline: true },
                  { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Raison', value: reason }
                ],
                color: 0xffa500,
                timestamp: new Date()
              }]
            });
          }
        }
      } catch {}
    } else if (sub === 'kick') {
      // DM l'utilisateur avec embed
      try {
        const embed = new EmbedBuilder()
          .setTitle('👢 Expulsion')
          .setDescription(`Tu as été expulsé du serveur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
          .setColor(0xffa500)
          .setTimestamp();
        await user.send({ embeds: [embed] });
      } catch {}
      await member.kick(reason).catch(() => {});
      await interaction.reply({ content: `👢 ${user.tag} expulsé. Raison : ${reason}`, ephemeral: true });

      // Logging modération
      try {
        const fs = require('fs');
        const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
        const conf = settings[interaction.guild.id]?.logs;
        if (conf?.enabled && conf.categories?.mod && conf.channel) {
          const logChannel = interaction.guild.channels.cache.get(conf.channel);
          if (logChannel) {
            logChannel.send({
              embeds: [{
                title: `⚠️ Sanction : Kick`,
                fields: [
                  { name: 'Membre', value: `${user.tag}`, inline: true },
                  { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Raison', value: reason }
                ],
                color: 0xffa500,
                timestamp: new Date()
              }]
            });
          }
        }
      } catch {}
    } else if (sub === 'warn') {
      // DM l'utilisateur avec embed
      try {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Avertissement')
          .setDescription(`Tu as reçu un avertissement sur **${interaction.guild.name}**.\n\n**Raison :** ${reason}`)
          .setColor(0xffc300)
          .setTimestamp();
        await user.send({ embeds: [embed] });
      } catch {}
      // Ajout dans warns.json
      const fs = require('fs');
      const path = require('path');
      const warnsPath = path.join(__dirname, '../warns.json');
      let warnsData = {};
      if (fs.existsSync(warnsPath)) {
        warnsData = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
      }
      if (!warnsData[interaction.guild.id]) warnsData[interaction.guild.id] = {};
      if (!warnsData[interaction.guild.id][user.id]) warnsData[interaction.guild.id][user.id] = [];
      warnsData[interaction.guild.id][user.id].push({
        moderator: interaction.user.tag,
        reason,
        date: new Date().toLocaleString()
      });
      fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));
      await interaction.reply({ content: `⚠️ ${user.tag} averti. Raison : ${reason}`, ephemeral: true });

      // Logging modération
      try {
        const fs = require('fs');
        const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
        const conf = settings[interaction.guild.id]?.logs;
        if (conf?.enabled && conf.categories?.mod && conf.channel) {
          const logChannel = interaction.guild.channels.cache.get(conf.channel);
          if (logChannel) {
            logChannel.send({
              embeds: [{
                title: `⚠️ Sanction : Warn`,
                fields: [
                  { name: 'Membre', value: `${user.tag}`, inline: true },
                  { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Raison', value: reason }
                ],
                color: 0xffa500,
                timestamp: new Date()
              }]
            });
          }
        }
      } catch {}
    } else if (sub === 'mute') {
      // DM l'utilisateur avec embed
      try {
        const embed = new EmbedBuilder()
          .setTitle('🔇 Mute')
          .setDescription(`Tu as été mute sur **${interaction.guild.name}**.\n\n**Raison :** ${reason}` + (duree ? `\n**Durée :** ${duree} minute(s)` : ''))
          .setColor(0x808080)
          .setTimestamp();
        await user.send({ embeds: [embed] });
      } catch {}
      // Utilise le rôle "mute" existant
      const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'mute');
      if (!muteRole) {
        await interaction.reply({ content: 'Aucun rôle "mute" trouvé.', ephemeral: true });
        return;
      }
      await member.roles.add(muteRole, reason).catch(() => {});
      await interaction.reply({ content: `🔇 ${user.tag} mute. Raison : ${reason}` + (duree ? ` (Durée : ${duree} min)` : ''), ephemeral: true });

      // Logging modération
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const conf = settings[interaction.guild.id]?.logs;
        if (conf?.enabled && conf.categories?.mod && conf.channel) {
          const logChannel = interaction.guild.channels.cache.get(conf.channel);
          if (logChannel) {
            logChannel.send({
              embeds: [{
                title: `⚠️ Sanction : Mute`,
                fields: [
                  { name: 'Membre', value: `${user.tag}`, inline: true },
                  { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Raison', value: reason },
                  ...(duree ? [{ name: 'Durée', value: `${duree} min`, inline: true }] : [])
                ],
                color: 0xffa500,
                timestamp: new Date()
              }]
            });
          }
        }
      } catch {}

      // Gestion du unmute automatique si durée spécifiée
      if (duree && duree > 0) {
        setTimeout(async () => {
          const freshMember = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (freshMember && freshMember.roles.cache.has(muteRole.id)) {
            await freshMember.roles.remove(muteRole, 'Fin du mute temporaire').catch(() => {});
            try {
              await user.send(`🔊 Tu as été unmute sur **${interaction.guild.name}** après ${duree} minute(s).`);
            } catch {}
          }
        }, duree * 60 * 1000);
      }
    }
  }
};
