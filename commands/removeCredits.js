const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql'); // Import MySQL pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecredits')
        .setDescription('Remove credits from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove credits from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of credits to remove')
                .setRequired(true)),

    async execute(interaction) {
        // Role-based permission check
        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        try {
            // Query the database for the user's current balance
            const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUser.id]);

            if (results.length === 0) {
                return interaction.reply({ content: `${targetUser.username} does not have an account yet.`, ephemeral: true });
            } else {
                const currentBalance = results[0].balance;
                const newBalance = currentBalance - amount;

                // Check if the balance goes negative
                if (newBalance < 0) {
                    return interaction.reply({ content: `${targetUser.username} does not have enough credits.`, ephemeral: true });
                }

                // Update the user's balance by deducting the amount
                await pool.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, targetUser.id]);
                return interaction.reply({ content: `Successfully removed ${amount} credits from ${targetUser.username}!`, ephemeral: true });
            }
        } catch (err) {
            console.error('Error removing credits:', err);
            return interaction.reply({ content: 'An error occurred while removing credits. Please try again later.', ephemeral: true });
        }
    }
};
