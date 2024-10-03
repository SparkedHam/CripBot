require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started deleting global commands.');

        await rest.put(
            Routes.applicationCommands(process.env.APPLICATION_ID),
            { body: [] } // This will clear all global commands
        );

        console.log('Successfully deleted all global commands.');
    } catch (error) {
        console.error(error);
    }
})();
