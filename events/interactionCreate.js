const { EmbedBuilder } = require('discord.js');
const { drawCards, calculateHand } = require('../utils/blackjack');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client, connection, gameState) {
        const userId = interaction.user.id;  // Ensure the user ID is correctly retrieved here

        // Handle Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                // Pass connection and userId to the command
                await command.execute(interaction, connection, gameState, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }

        // Handle Button Interactions (e.g., hit, stand, double in blackjack)
        if (interaction.isButton()) {
            const game = gameState[userId];  // Retrieve the game state using the correct user ID

            if (!game) {
                return interaction.reply({ content: 'You are not currently in a blackjack game.', ephemeral: true });
            }

            const { playerCards, dealerCards, bet, hasDoubled } = game;
            const playerTotal = calculateHand(playerCards);

            // Handle Double Down
            if (interaction.customId === 'double') {
                await interaction.deferUpdate();

                const { userId } = game;  // Ensure userId is coming from gameState here

                if (playerCards.length !== 2 || hasDoubled) {
                    return interaction.reply({ content: 'You can only double down on your first move.', ephemeral: true });
                }

                const doubledBet = bet * 2;
                gameState[userId].bet = doubledBet;
                gameState[userId].hasDoubled = true;

                // Deduct the additional double bet amount (the difference, not the full bet again)
                connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId], (err) => {
                    if (err) throw err;
                });

                // Player draws one more card
                const newCard = drawCards(1)[0];
                playerCards.push(newCard);
                const newPlayerTotal = calculateHand(playerCards);

                if (newPlayerTotal > 21) {
                    // No additional bet deduction on bust, only use doubledBet to indicate what was already deducted
                    const embed = new EmbedBuilder()
                        .setTitle('Blackjack')
                        .setDescription(`You doubled down and drew a ${newCard}. Your hand: ${playerCards.join(', ')} (Total: ${newPlayerTotal}). You busted!`)
                        .setColor(0xFF0000);

                    interaction.editReply({ embeds: [embed], components: [] });
                    delete gameState[userId];
                } else {
                    await processDealerTurn(interaction, game, doubledBet, connection, gameState);
                }

                return;
            }

            // Handle Hit
            if (interaction.customId === 'hit') {
                await interaction.deferUpdate();

                const newCard = drawCards(1)[0];
                playerCards.push(newCard);
                const newPlayerTotal = calculateHand(playerCards);

                if (newPlayerTotal > 21) {
                    // Player busted, do not deduct the bet again since it was deducted at game start
                    const embed = new EmbedBuilder()
                        .setTitle('Blackjack')
                        .setDescription(`You drew a ${newCard}. Your hand: ${playerCards.join(', ')} (Total: ${newPlayerTotal}). You busted!`)
                        .setColor(0xFF0000);

                    interaction.editReply({ embeds: [embed], components: [] });
                    delete gameState[userId];  // End the game
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('Blackjack')
                        .setDescription(`Your cards: ${playerCards.join(', ')} (Total: ${newPlayerTotal})\nDealer's visible card: ${dealerCards[0]}`)
                        .setColor(0x00FF00);

                    interaction.editReply({ embeds: [embed], components: interaction.message.components });
                }

                return;
            }

            // Handle Stand
            if (interaction.customId === 'stand') {
                await interaction.deferUpdate();
                await processDealerTurn(interaction, game, bet, connection, gameState);
            }
        }
    }
};

/**
 * Process the dealer's turn and resolve the game
 */
/**
 * Process the dealer's turn and resolve the game
 */
async function processDealerTurn(interaction, game, bet, connection, gameState) {
    const { playerCards, dealerCards, userId } = game;  // Ensure userId is properly retrieved here
    const playerTotal = calculateHand(playerCards);

    // Dealer draws cards until their total is at least 17
    while (calculateHand(dealerCards) < 17) {
        dealerCards.push(drawCards(1)[0]);
    }

    const dealerTotal = calculateHand(dealerCards);

    let result;
    let color;  // Define a variable for the color
    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        // Player wins - Add only the winnings (bet amount) back
        result = `You win! You gained ${bet} tokens.`;
        color = 0x00FF00;  // Green color for win

        connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet * 2, userId], (err, results) => {
            if (err) {
                console.error('Error updating balance:', err);
                return interaction.editReply({ content: 'Error updating balance.', ephemeral: true });
            }
            console.log(`Updated balance for user ${userId}:`, results);
        });

    } else if (playerTotal < dealerTotal) {
        // Player loses
        result = `You lose! You lost ${bet} tokens.`;
        color = 0xFF0000;  // Red color for loss

    } else {
        // It's a push, return the original bet only
        result = 'It\'s a push! Your bet has been returned.';
        color = 0xFFFF00;  // Yellow color for push

        connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet, userId], (err, results) => {
            if (err) {
                console.error('Error updating balance:', err);
                return interaction.editReply({ content: 'Error returning balance.', ephemeral: true });
            }
            console.log(`Returned bet for user ${userId}:`, results);
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('Blackjack')
        .setDescription(`Your cards: ${playerCards.join(', ')} (Total: ${playerTotal})\nDealer's cards: ${dealerCards.join(', ')} (Total: ${dealerTotal})\n${result}`)
        .setColor(color);  // Set the embed color based on the result

    // Update the interaction with the result and remove the buttons
    await interaction.editReply({ embeds: [embed], components: [] });

    // Remove the game state for the user as the game has ended
    delete gameState[userId];
}

