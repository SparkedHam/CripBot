const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql');  // Import the promise-based pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your token balance or another user\'s balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance to check')),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;

        try {
            // Query the database using promise-based pool
            const [results] = await pool.query('SELECT balance FROM users WHERE id = ?', [userId]);

            // Check if the user exists in the database
            if (results.length === 0) {
                return interaction.reply({ content: `${targetUser.username} has no tokens yet.`, ephemeral: true });
            } else {
                const balance = results[0].balance;
                return interaction.reply({ content: `${targetUser.username} has ${balance} tokens.`, ephemeral: true });
            }
        } catch (err) {
            console.error('Database query failed:', err);
            return interaction.reply({ content: 'An error occurred while fetching the balance.', ephemeral: true });
        }
    }
};
