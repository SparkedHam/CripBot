require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder, ActivityType, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const moment = require('moment');
const gameState = {};
const mysql = require('mysql2');

// MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Connect to the database
connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the MySQL database.');
});

client.once('ready', () => {
    console.log('Bot is online!');

    // Set bot's status to appear online on a mobile device
    client.user.setPresence({
        status: 'dnd', // Status: online, idle, dnd, invisible
        activities: [{
            name: 'Fuck the Saints',
            type: ActivityType.Streaming, // or other activity types like Streaming, Listening, etc.
            url: 'https://youtu.be/dQw4w9WgXcQ?si=rVEdh9HDnU-ptso6'
        }],
        afk: false,
        shardId: [0] // Optional, depending on your setup
    });

    // Simulate mobile status (show as online on a phone)
    client.user.setStatus('online'); // Set status to online
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;

    /**
     * NEWRADIO COMMAND - Automatically generate a new radio frequency
     */
    if (commandName === 'newradio') {
        const radioChannel = interaction.guild.channels.cache.get(process.env.RADIO_CHANNEL_ID);

        if (!radioChannel) return interaction.reply({ content: "Channel not found", ephemeral: true });

        // Generate the radio number
        const part1 = Math.floor(Math.random() * (999 - 20 + 1)) + 20;
        const part2 = Math.floor(Math.random() * 100);
        const radioFrequency = `${part1}.${part2 < 10 ? '0' + part2 : part2}`;

        // Set new channel name
        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('New Radio')
            .setDescription(`New Radio Frequency: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        // Send embed to the channel by ID
        await radioChannel.send({ content: '@everyone', embeds: [embed] });

        await interaction.reply({ content: `New radio frequency set to ${radioFrequency}`, ephemeral: true });
    }

    /**
     * PING COMMAND - Check the bot's ping to the API server and WebSocket
     */
    if (commandName === 'ping') {
        // Get the WebSocket ping
        const ping = client.ws.ping;

        // Get the API latency (time to respond to the interaction)
        const apiLatencyStart = Date.now();
        await interaction.deferReply();
        const apiLatencyEnd = Date.now();
        const apiLatency = apiLatencyEnd - apiLatencyStart;

        // Create embed with ping details
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`**WebSocket Ping:** ${ping}ms\n**API Latency:** ${apiLatency}ms`)
            .setColor(0x99FFFF);

        // Send the embed in the same channel the command was run in
        await interaction.editReply({ embeds: [embed] });
    }

    /**
     * SETRADIO COMMAND - Manually set a frequency
     */
    if (commandName === 'setradio') {
        const radioFrequency = interaction.options.getString('frequency');
        const radioChannel = interaction.guild.channels.cache.get(process.env.RADIO_CHANNEL_ID);

        if (!radioChannel) return interaction.reply({ content: "Channel not found", ephemeral: true });

        // Ensure the radio frequency is in the correct format (e.g., 123.45)
        const radioRegex = /^\d{2,3}\.\d{2}$/;
        if (!radioRegex.test(radioFrequency)) {
            return interaction.reply({ content: "Invalid radio frequency format. Please use the format XXX.XX.", ephemeral: true });
        }

        // Set the channel name
        const [part1, part2] = radioFrequency.split('.');
        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Set Radio')
            .setDescription(`Radio frequency set to: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        // Send embed to the channel
        await radioChannel.send({ content: '@everyone', embeds: [embed] });

        await interaction.reply({ content: `Radio frequency successfully set to ${radioFrequency}`, ephemeral: true });
    }

    /**
     * CLAIM TOKENS COMMAND
     */
    if (interaction.commandName === 'claimtokens') {
        const userId = interaction.user.id;

        // Check if user exists in the database
        connection.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) throw err;

            const currentTime = new Date();

            if (results.length === 0) {
                // If user is not in the database, add them and give initial tokens
                connection.query('INSERT INTO users (id, username, balance, last_claim) VALUES (?, ?, ?, ?)', [userId, interaction.user.username, 1500, currentTime], (err) => {
                    if (err) throw err;
                    interaction.reply({ content: 'You have successfully claimed 1500 tokens!', ephemeral: true });
                });
            } else {
                const lastClaim = results[0].last_claim ? moment(results[0].last_claim) : null;
                const timeDifference = lastClaim ? moment().diff(lastClaim, 'hours') : 24;

                if (timeDifference >= 24) {
                    // Update user's token balance and last claim timestamp
                    connection.query('UPDATE users SET balance = balance + 1500, last_claim = ? WHERE id = ?', [currentTime, userId], (err) => {
                        if (err) throw err;
                        interaction.reply({ content: 'You have successfully claimed 1500 tokens!', ephemeral: true });
                    });
                } else {
                    interaction.reply({ content: `You can only claim tokens once every 24 hours. Please try again later.`, ephemeral: true });
                }
            }
        });
    }

    /**
     * BLACKJACK COMMAND
     */
    if (interaction.commandName === 'blackjack') {
        const bet = interaction.options.getInteger('bet');
        const userId = interaction.user.id;

        // Fetch the user's current balance
        connection.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) throw err;

            if (results.length === 0 || results[0].balance < bet) {
                return interaction.reply({ content: 'You do not have enough tokens to place this bet.', ephemeral: true });
            }

            // Blackjack logic and initial card dealing goes here
            // This is a simplified example, and you can expand the game logic as needed

            const playerCards = drawCards(2); // Example function to draw 2 cards for player
            const dealerCards = drawCards(2); // Example function to draw 2 cards for dealer

            const embed = new EmbedBuilder()
                .setTitle('Blackjack')
                .setDescription(`Your cards: ${playerCards.join(', ')}\nDealer's cards: ${dealerCards[0]}, ?`)
                .setColor(0x00FF00);

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hit')
                        .setLabel('Hit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stand')
                        .setLabel('Stand')
                        .setStyle(ButtonStyle.Secondary),
                );

            interaction.reply({ embeds: [embed], components: [buttons] });

            // Store game state in memory for the current player
            gameState[interaction.user.id] = {
                playerCards,
                dealerCards,
                bet,
            };
        });
    }

    if (interaction.commandName === 'balance') {
        const userId = interaction.user.id;

        // Query the database for the user's balance
        connection.query('SELECT balance FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                // If the user is not found in the database, assume they have not claimed tokens yet
                interaction.reply({ content: 'You have no tokens yet. Use /claimtokens to get your initial balance of 1500 tokens.', ephemeral: true });
            } else {
                // Retrieve the user's balance from the database
                const balance = results[0].balance;

                // Reply with the user's balance
                interaction.reply({ content: `You have ${balance} tokens.`, ephemeral: true });
            }
        });
    }

    /**
     * Blackjack Logic
     */
    if (interaction.isButton()) {
        if (!gameState[userId]) {
            return interaction.reply({ content: 'You are not currently in a blackjack game.', ephemeral: true });
        }

        const game = gameState[userId];
        const { playerCards, dealerCards, bet } = game;

        if (interaction.customId === 'hit') {
            // Player draws a card
            const newCard = drawCards(1)[0];
            playerCards.push(newCard);

            // Check if player has busted (sum of cards > 21)
            if (calculateHand(playerCards) > 21) {
                // Player loses
                connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId], (err) => {
                    if (err) throw err;

                    // Update interaction when the player busts
                    interaction.update({
                        content: `You drew a ${newCard}. Your hand is ${playerCards.join(', ')} and you busted! You lost ${bet} tokens.`,
                        components: [] // Remove buttons after interaction is done
                    });
                    delete gameState[userId]; // Remove the game state after the game ends
                });
            } else {
                // Continue the game, player hasn't busted
                const embed = new EmbedBuilder()
                    .setTitle('Blackjack')
                    .setDescription(`Your cards: ${playerCards.join(', ')}\nDealer's cards: ${dealerCards[0]}, ?`)
                    .setColor(0x00FF00);

                // Update the interaction to reflect the new card
                interaction.update({
                    embeds: [embed],
                    components: interaction.message.components // Keep buttons intact
                });
            }
        } else if (interaction.customId === 'stand') {
            // Player stands, dealer draws and determines the winner
            while (calculateHand(dealerCards) < 17) {
                dealerCards.push(drawCards(1)[0]);
            }

            const playerTotal = calculateHand(playerCards);
            const dealerTotal = calculateHand(dealerCards);

            let result;
            if (dealerTotal > 21 || playerTotal > dealerTotal) {
                // Player wins
                result = `You win! You gained ${bet} tokens.`;
                connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet, userId], (err) => {
                    if (err) throw err;
                });
            } else if (playerTotal < dealerTotal) {
                // Player loses
                result = `You lose! You lost ${bet} tokens.`;
                connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId], (err) => {
                    if (err) throw err;
                });
            } else {
                // Draw
                result = 'It\'s a draw! No tokens were lost or won.';
            }

            const embed = new EmbedBuilder()
                .setTitle('Blackjack')
                .setDescription(`Your cards: ${playerCards.join(', ')} (Total: ${playerTotal})\nDealer's cards: ${dealerCards.join(', ')} (Total: ${dealerTotal})\n${result}`)
                .setColor(0x00FF00);

            // Update the interaction with the result and remove the buttons
            interaction.update({
                embeds: [embed],
                components: [] // Remove buttons after interaction is done
            });
            delete gameState[userId]; // Remove the game state after the game ends
        }
    }
});

/**
 * Calculate the total value of a hand in Blackjack
 * @param num
 * @returns {*[]}
 */
function drawCards(num) {
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const hand = [];

    for (let i = 0; i < num; i++) {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        hand.push(randomCard);
    }

    return hand;
}

/**
 * Calculate the total value of a hand in Blackjack
 * @param cards
 * @returns {number}
 */
function calculateHand(cards) {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
        if (['J', 'Q', 'K'].includes(card)) {
            total += 10;
        } else if (card === 'A') {
            aces += 1;
            total += 11;
        } else {
            total += parseInt(card);
        }
    });

    // Adjust for aces
    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }

    return total;
}


// Register the slash command
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID),
            { body: [
                    new SlashCommandBuilder()
                        .setName('newradio')
                        .setDescription('Automatically generates a new radio frequency'),
                    new SlashCommandBuilder()
                        .setName('ping')
                        .setDescription('Shows the current bot ping to the API server and WebSocket'),
                    new SlashCommandBuilder()
                        .setName('setradio')
                        .setDescription('Sets a custom radio frequency')
                        .addStringOption(option =>
                            option.setName('frequency')
                                .setDescription('The radio frequency to set (e.g., 123.45)')
                                .setRequired(true)),
                    new SlashCommandBuilder()
                        .setName('claimtokens')
                        .setDescription('Claim 1500 tokens once every 24 hours'),
                    new SlashCommandBuilder()
                        .setName('blackjack')
                        .setDescription('Start a blackjack game with a bet')
                        .addIntegerOption(option =>
                            option.setName('bet')
                                .setDescription('The amount you want to bet')
                                .setRequired(true)),
                    new SlashCommandBuilder()
                        .setName('balance')
                        .setDescription('Check your token balance')
                ] }
        );

        // await rest.put(
        //     Routes.applicationCommands(process.env.APPLICATION_ID),
        //     { body: [
        //             new SlashCommandBuilder()
        //                 .setName('newradio')
        //                 .setDescription('Automatically generates a new radio frequency'),
        //             new SlashCommandBuilder()
        //                 .setName('ping')
        //                 .setDescription('Shows the current bot ping to the API server and WebSocket'),
        //             new SlashCommandBuilder()
        //                 .setName('setradio')
        //                 .setDescription('Sets a custom radio frequency')
        //                 .addStringOption(option =>
        //                     option.setName('frequency')
        //                         .setDescription('The radio frequency to set (e.g., 123.45)')
        //                         .setRequired(true)),
        //             new SlashCommandBuilder()
        //                 .setName('claimtokens')
        //                 .setDescription('Claim 1500 tokens once every 24 hours'),
        //             new SlashCommandBuilder()
        //                 .setName('blackjack')
        //                 .setDescription('Start a blackjack game with a bet')
        //                 .addIntegerOption(option =>
        //                     option.setName('bet')
        //                         .setDescription('The amount you want to bet')
        //                         .setRequired(true)),
        //             new SlashCommandBuilder()
        //                 .setName('balance')
        //                 .setDescription('Check your token balance')
        //         ] },
        // );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.login(process.env.DISCORD_TOKEN);
