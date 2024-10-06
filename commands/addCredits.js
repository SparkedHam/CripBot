const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql'); // Import the MySQL pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcredits')
        .setDescription('Add credits to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add credits to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of credits to add')
                .setRequired(true)),

    async execute(interaction) {
        // Role-based permission check
        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        try {
            // Check if the user exists in the database
            const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUser.id]);

            if (results.length === 0) {
                // If user is not found, insert them into the database with the initial balance
                await pool.query('INSERT INTO users (id, username, balance) VALUES (?, ?, ?)', [targetUser.id, targetUser.username, amount]);
                await interaction.reply({ content: `Successfully added ${amount} credits to ${targetUser.username}!`, ephemeral: true });
            } else {
                // Update the user's balance
                await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, targetUser.id]);
                await interaction.reply({ content: `Successfully added ${amount} credits to ${targetUser.username}!`, ephemeral: true });
            }
        } catch (err) {
            console.error('Error executing addcredits command:', err);
            await interaction.reply({ content: 'An error occurred while adding credits. Please try again later.', ephemeral: true });
        }
    }
};
