const { EmbedBuilder } = require('discord.js');
const { drawCards, calculateHand } = require('../utils/blackjack');
const pool = require('../utils/mysql'); // Import the pool

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client, gameState) {
        const userId = interaction.user.id;

        // Handle Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                // Execute the command and pass necessary parameters
                await command.execute(interaction, gameState, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }

        // Handle Button Interactions (e.g., hit, stand, double in blackjack)
        if (interaction.isButton()) {
            const game = gameState[userId]; // Retrieve the game state using the user ID

            if (!game) {
                return interaction.reply({ content: 'You are not currently in a blackjack game.', ephemeral: true });
            }

            const { playerCards, dealerCards, bet, hasDoubled } = game;

            // Handle Double Down
            if (interaction.customId === 'double') {
                await interaction.deferUpdate();

                if (playerCards.length !== 2 || hasDoubled) {
                    return interaction.reply({ content: 'You can only double down on your first move.', ephemeral: true });
                }

                const doubledBet = bet * 2;
                gameState[userId].bet = doubledBet;
                gameState[userId].hasDoubled = true;

                // Deduct the additional double bet amount
                try {
                    await pool.query('UPDATE users SET balance = balance - ? WHERE id = ?', [bet, userId]);

                    // Player draws one more card
                    const newCard = drawCards(1)[0];
                    playerCards.push(newCard);
                    const newPlayerTotal = calculateHand(playerCards);

                    if (newPlayerTotal > 21) {
                        const embed = new EmbedBuilder()
                            .setTitle('Blackjack')
                            .setDescription(`You doubled down and drew a ${newCard}. Your hand: ${playerCards.join(', ')} (Total: ${newPlayerTotal}). You busted!`)
                            .setColor(0xFF0000);

                        interaction.editReply({ embeds: [embed], components: [] });
                        delete gameState[userId];  // End the game
                    } else {
                        await processDealerTurn(interaction, game, doubledBet, gameState);
                    }
                } catch (err) {
                    console.error('Error during double down:', err);
                    return interaction.reply({ content: 'Error processing the double down.', ephemeral: true });
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
                await processDealerTurn(interaction, game, bet, gameState);
            }
        }
    }
};

/**
 * Process the dealer's turn and resolve the game
 */
async function processDealerTurn(interaction, game, bet, gameState) {
    const { playerCards, dealerCards, userId } = game;
    const playerTotal = calculateHand(playerCards);

    // Dealer draws cards until their total is at least 17
    while (calculateHand(dealerCards) < 17) {
        dealerCards.push(drawCards(1)[0]);
    }

    const dealerTotal = calculateHand(dealerCards);
    let result;
    let color;

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        result = `You win! You gained ${bet} tokens.`;
        color = 0x00FF00;  // Green color for win

        try {
            await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet * 2, userId]);
        } catch (err) {
            console.error('Error updating balance for win:', err);
            return interaction.reply({ content: 'Error updating balance.', ephemeral: true });
        }
    } else if (playerTotal < dealerTotal) {
        result = `You lose! You lost ${bet} tokens.`;
        color = 0xFF0000;  // Red color for loss
    } else {
        result = 'It\'s a push! Your bet has been returned.';
        color = 0xFFFF00;  // Yellow color for push

        try {
            await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet, userId]);
        } catch (err) {
            console.error('Error returning bet:', err);
            return interaction.reply({ content: 'Error returning balance.', ephemeral: true });
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Blackjack')
        .setDescription(`Your cards: ${playerCards.join(', ')} (Total: ${playerTotal})\nDealer's cards: ${dealerCards.join(', ')} (Total: ${dealerTotal})\n${result}`)
        .setColor(color);

    await interaction.editReply({ embeds: [embed], components: [] });
    delete gameState[userId];  // End the game
}
