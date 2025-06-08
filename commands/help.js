const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes du bot')
    .addSubcommand(sub =>
      sub.setName('admin')
        .setDescription('Commandes pour administrateurs')
    )
    .addSubcommand(sub =>
      sub.setName('moderator')
        .setDescription('Commandes de modération')
    )
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Commandes pour les membres')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // --- ADMIN ---
    if (sub === 'admin') {
      // Page 1
      const embed1 = new EmbedBuilder()
        .setTitle('Commandes Admin (1/2)')
        .setDescription(
          `• **/automod enable** : Activer l'automod\n` +
          `• **/automod disable** : Désactiver l'automod\n` +
          `• **/automod status** : Statut de l'automod\n` +
          `• **/automod category** : Activer/désactiver une catégorie\n` +
          `• **/automod sanction** : Définir la sanction d'une catégorie\n` +
          `• **/automod ignorerole add/remove** : Gérer les rôles ignorés\n` +
          `• **/automod ignorechannel add/remove** : Gérer les salons ignorés\n` +
          `• **/automod listmod** : Voir l'historique automod d'un utilisateur\n` +
          `• **/automod clearmod** : Effacer l'historique automod d'un utilisateur\n` +
          `• **/automod setchannel** : Définir le salon d'actions automod\n` +
          `• **/automod reset** : Réinitialiser la configuration de l'automod`
        )
        .setColor(0xff0000)
        .setFooter({ text: 'Page 1/2 - Utilisez les boutons pour naviguer' });

      // Page 2
      const embed2 = new EmbedBuilder()
        .setTitle('Commandes Admin (2/2)')
        .setDescription(
          `• **/setmoderatorrole** : Définir le rôle modérateur (/mod)\n` +
          `• **/botreset** : Réinitialiser tout le bot\n` +
          `• **/warnaction** : Action automatique selon le nombre de warns\n` +
          `• **/level setchannel** : Définir le salon d'annonce de niveau\n` +
          `• **/level setrolebooster** : Définir un rôle booster d'XP\n` +
          `• **/level enable/disable/status/reset/messagetest**\n` +
          `• **/welcome enable/disable/status/setchannel/test**\n` +
          `• **/farewell enable/disable/status/setchannel/test**\n` +
          `• **/autoannounce account add/remove**\n` +
          `• **/autoannounce setchannel/enable/disable/status/test**\n` +
          `• **/license**\n` +
          `• **/help**`
        )
        .setColor(0xff0000)
        .setFooter({ text: 'Page 2/2 - Utilisez les boutons pour naviguer' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_admin_prev')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('help_admin_next')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Secondary)
        );

      const msg = await interaction.reply({ embeds: [embed1], components: [row], ephemeral: true, fetchReply: true });

      const collector = msg.createMessageComponentCollector({ time: 60000 });
      let page = 1;
      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: 'Ce menu n\'est pas pour vous.', ephemeral: true });
        if (i.customId === 'help_admin_next') {
          page = 2;
          await i.update({
            embeds: [embed2],
            components: [new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('help_admin_prev')
                  .setLabel('⬅️')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('help_admin_next')
                  .setLabel('➡️')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              )]
          });
        } else if (i.customId === 'help_admin_prev') {
          page = 1;
          await i.update({
            embeds: [embed1],
            components: [row]
          });
        }
      });
      return;
    }

    // --- MODERATOR ---
    if (sub === 'moderator') {
      await interaction.reply({
        embeds: [{
          title: 'Commandes Modération',
          description:
            `• /mod ban — Bannir un utilisateur\n` +
            `• /mod kick — Expulser un utilisateur\n` +
            `• /mod warn — Avertir un utilisateur\n` +
            `• /mod mute — Mute un utilisateur (avec durée)\n` +
            `• /unban — Débannir un utilisateur\n` +
            `• /unmute — Unmute un utilisateur\n` +
            `• /viewwarn — Voir les warns d'un utilisateur\n`,
          color: 0xffa500
        }],
        ephemeral: true
      });
      return;
    }

    // --- USER ---
    if (sub === 'user') {
      await interaction.reply({
        embeds: [{
          title: 'Commandes Utilisateur',
          description:
            `• /help — Afficher cette aide\n` +
            `• /license — Afficher la licence du bot\n` +
            `• /dog — Image de chien aléatoire\n` +
            `• /cat — Image de chat aléatoire\n` +
            `• /ping — Latence du bot\n` +
            `• /about — À propos du bot\n` +
            `• /aboutme — À propos de vous\n` +
            `• /gayrater — Mesure le taux de gay (fun)\n` +
            `• /status — Statut du bot\n`,
          color: 0x00bfff
        }],
        ephemeral: true
      });
      return;
    }
  }
};
