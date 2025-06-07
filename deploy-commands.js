const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // Facultatif pour développement

// Initialisation de REST
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Résolution du chemin courant (__dirname déjà dispo en CommonJS)
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // utilise .js pour CommonJS

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath); // utilisation de require() ici

  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[ATTENTION] La commande dans ${file} est invalide.`);
  }
}

// Déploiement des commandes
(async () => {
  try {
    console.log(`🔁 Déploiement de ${commands.length} commande(s)...`);

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`✅ Commandes enregistrées sur le serveur (${GUILD_ID})`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes :', error);
  }
})();
