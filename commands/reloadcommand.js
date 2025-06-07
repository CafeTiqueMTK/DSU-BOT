const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reloadcommand')
    .setDescription('Recharge dynamiquement toutes les commandes du bot (admin uniquement)'),

  async execute(interaction) {
    // Charger config
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8'));
    const commandsPath = path.join(__dirname);
    const client = interaction.client;

    // Recharger les commandes
    client.commands.clear();
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commandsArray = [];
    for (const file of commandFiles) {
      if (file === 'reloadcommand.js') continue; // Ne pas recharger cette commande elle-même
      const filePath = path.join(commandsPath, file);
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
    }

    // Déployer les commandes via REST
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandsArray }
      );
      await interaction.reply('✅ Les commandes ont été rechargées et redéployées avec succès.');
    } catch (error) {
      console.error(error);
      await interaction.reply('❌ Une erreur est survenue lors du rechargement des commandes.');
    }
  }
};
