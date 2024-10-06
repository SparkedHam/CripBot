const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const connection = require('./utils/mysql');
require('dotenv').config();
const gameState = {};
const pool = require('./utils/mysql');

console.log('Starting the bot...');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command in ${file} is missing required properties.`);
    }
}

// Load event listeners
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, connection, gameState)); // Pass the connection to event handler
    } else {
        client.on(event.name, (...args) => event.execute(...args, client, connection, gameState)); // Pass the connection to event handler
    }
    console.log(`Loaded event: ${event.name}`);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error);
});

client.once('ready', () => {
    console.log('Bot is Ready & Online!');

    // Set bot's status to appear online on a mobile device
    client.user.setPresence({
        status: 'dnd', // Status: online, idle, dnd, invisible
        activities: [{
            name: 'Fuck the Saints',
            type: ActivityType.Watching, // Activity type
        }],
        afk: false,
        shardId: [0] // Optional, depending on your setup
    });

    (async () => {
        try {
            // Example query using the pool
            const [rows] = await pool.query('SELECT 1 + 1 AS solution');
            console.log('Test query result:', rows[0].solution);  // This should log '2'
        } catch (err) {
            console.error('Database query failed:', err);
        }
    })();

    // Simulate mobile status (show as online on a phone)
    client.user.setStatus('online'); // Set status to online
});
