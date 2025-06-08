const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearmsg')
    .setDescription('Supprime les derniers messages d\'un utilisateur dans ce salon')
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Supprimer les messages d\'un utilisateur')
        .addUserOption(opt =>
          opt.setName('utilisateur')
            .setDescription('Utilisateur ciblé')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre de messages à supprimer (max 100)')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'user') return;

    const user = interaction.options.getUser('utilisateur');
    const nombre = interaction.options.getInteger('nombre');
    if (nombre < 1 || nombre > 100) {
      await interaction.reply({ content: 'Le nombre doit être entre 1 et 100.', ephemeral: true });
      return;
    }

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const toDelete = messages.filter(m => m.author.id === user.id).first(nombre);

    if (toDelete.length === 0) {
      await interaction.reply({ content: `Aucun message trouvé pour ${user.tag}.`, ephemeral: true });
      return;
    }

    await channel.bulkDelete(toDelete, true);
    await interaction.reply({ content: `🧹 ${toDelete.length} message(s) de ${user.tag} supprimé(s).`, ephemeral: true });
  }
};
