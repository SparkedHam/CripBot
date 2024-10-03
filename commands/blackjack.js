const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { drawCards, calculateHand } = require('../utils/blackjack');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a blackjack game')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Enter your bet amount')
                .setRequired(true)),

    async execute(interaction, connection, gameState) {
        const userId = interaction.user.id;
        const bet = interaction.options.getInteger('bet');

        // Check if user has enough balance
        connection.query('SELECT balance FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) throw err;

            const balance = results[0]?.balance || 0;

            if (balance < bet) {
                return interaction.reply({ content: 'You do not have enough tokens to place this bet.', ephemeral: true });
            }

            // Deduct the bet from the user's balance
            connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId], (err) => {
                if (err) throw err;
            });

            // Initialize the game
            const playerCards = drawCards(2);
            const dealerCards = drawCards(2);
            const playerTotal = calculateHand(playerCards);
            const dealerVisibleCard = dealerCards[0];

            // Check for player blackjack
            if (playerTotal === 21) {
                const blackjackPayout = bet * 3;  // 3:1 payout for blackjack

                connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [blackjackPayout, userId], (err) => {
                    if (err) throw err;

                    const embed = new EmbedBuilder()
                        .setTitle('Blackjack!')
                        .setDescription(`Blackjack! You won ${blackjackPayout} tokens! Your cards: ${playerCards.join(', ')}`)
                        .setColor(0x00FF00);

                    // End the game immediately, no buttons needed
                    return interaction.reply({ embeds: [embed], components: [] }); // No buttons as the game is over
                });

                // No need to proceed further if player gets blackjack
                return;
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
            interaction.reply({ embeds: [embed], components: [buttons] });
        });
    }
};
