const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { drawCards, calculateHand } = require('../utils/blackjack');
const pool = require('../utils/mysql');  // Import the pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a blackjack game')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Enter your bet amount')
                .setRequired(true)),

    async execute(interaction, gameState) {
        const userId = interaction.user.id;
        const bet = interaction.options.getInteger('bet');

        try {
            // Check if the user has enough balance using async/await
            const [results] = await pool.query('SELECT balance FROM users WHERE id = ?', [userId]);
            const balance = results[0]?.balance || 0;

            if (balance < bet) {
                return interaction.reply({ content: 'You do not have enough tokens to place this bet.', ephemeral: true });
            }

            // Deduct the bet from the user's balance
            await pool.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId]);

            // Initialize the game
            const playerCards = drawCards(2);
            const dealerCards = drawCards(2);
            const playerTotal = calculateHand(playerCards);
            const dealerVisibleCard = dealerCards[0];

            // Check for player blackjack
            if (playerTotal === 21) {
                const blackjackPayout = bet * 3;  // 3:1 payout for blackjack

                await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [blackjackPayout, userId]);

                const embed = new EmbedBuilder()
                    .setTitle('Blackjack!')
                    .setDescription(`Blackjack! You won ${blackjackPayout} tokens! Your cards: ${playerCards.join(', ')}`)
                    .setColor(0x00FF00);

                // End the game immediately, no buttons needed
                return interaction.reply({ embeds: [embed], components: [] });
            }

            // Save game state for the player
            gameState[userId] = {
                playerCards,
                dealerCards,
                bet,
                userId,
                hasDoubled: false
            };

            // Create the embed for the game
            const embed = new EmbedBuilder()
                .setTitle('Blackjack')
                .setDescription(`Your cards: ${playerCards.join(', ')} (Total: ${playerTotal})\nDealer's visible card: ${dealerVisibleCard}`)
                .setColor(0x00FF00);

            // Create the buttons for Hit, Stand, and Double
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
                    new ButtonBuilder()
                        .setCustomId('double')
                        .setLabel('Double Down')
                        .setStyle(ButtonStyle.Danger)
                );

            // Send the message with the embed and buttons
            await interaction.reply({ embeds: [embed], components: [buttons] });

        } catch (err) {
            console.error('Error during blackjack execution:', err);
            return interaction.reply({ content: 'An error occurred while processing the game.', ephemeral: true });
        }
    }
};
