const moment = require('moment');
const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql'); // Import MySQL pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claimtokens')
        .setDescription('Claim your hourly tokens'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const currentTime = new Date();

        try {
            // Query the database for the user's last claim time
            const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

            if (results.length === 0) {
                // If user doesn't exist, insert them with initial tokens and current timestamp
                await pool.query('INSERT INTO users (id, username, balance, last_claim) VALUES (?, ?, ?, ?)', [userId, interaction.user.username, 100000, currentTime]);
                return interaction.reply({ content: 'You have successfully claimed 100000 tokens!', ephemeral: true });
            } else {
                const lastClaim = results[0].last_claim ? moment(results[0].last_claim) : null;
                const timeDifference = lastClaim ? moment().diff(lastClaim, 'hours') : 1;

                if (timeDifference >= 1) {
                    // Update the balance and last claim time if the cooldown period has passed
                    await pool.query('UPDATE users SET balance = balance + 100000, last_claim = ? WHERE id = ?', [currentTime, userId]);
                    return interaction.reply({ content: 'You have successfully claimed 100000 tokens!', ephemeral: true });
                } else {
                    // User tried to claim tokens before cooldown
                    return interaction.reply({ content: 'You can only claim tokens once every 1 hour. Please try again later.', ephemeral: true });
                }
            }
        } catch (err) {
            console.error('Error claiming tokens:', err);
            return interaction.reply({ content: 'An error occurred while claiming tokens. Please try again later.', ephemeral: true });
        }
    }
};
