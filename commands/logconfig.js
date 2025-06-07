const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const settingsPath = './settings.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logconfigure')
    .setDescription('Configurer les catégories des logs')
    // Ajoutez toutes les sous-commandes avec options requises AVANT celles sans options requises
    .addSubcommand(cmd =>
      cmd.setName('category')
        .setDescription('Activer ou désactiver une catégorie')
        .addStringOption(option =>
          option.setName('nom')
            .setDescription('Nom de la catégorie')
            .setRequired(true)
            .addChoices(
              { name: 'arrived', value: 'arrived' },
              { name: 'farewell', value: 'farewell' },
              { name: 'vocal', value: 'vocal' },
              { name: 'mod', value: 'mod' },
              { name: 'automod', value: 'automod' }
            ))
        .addBooleanOption(option =>
          option.setName('etat')
            .setDescription('Activer ou désactiver')
            .setRequired(true)
        )
    )
    // Ajoutez ici d'autres sous-commandes avec options requises
    // Puis ajoutez les sous-commandes sans options requises (exemple :)
    // .addSubcommand(cmd =>
    //   cmd.setName('reset')
    //     .setDescription('Réinitialise complètement la configuration des logs')
    // )
    ,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const name = interaction.options.getString('nom');
    const etat = interaction.options.getBoolean('etat');

    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    if (!settings[guildId]) settings[guildId] = {};
    if (!settings[guildId].logs) {
      settings[guildId].logs = {
        enabled: false,
        categories: {
          arrived: false,
          farewell: false,
          vocal: false,
          mod: false,
          automod: false
        }
      };
    }

    settings[guildId].logs.categories[name] = etat;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    await interaction.reply(`🔧 La catégorie \`${name}\` est maintenant ${etat ? 'activée ✅' : 'désactivée ❌'}.`);
  }
};
