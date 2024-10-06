const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql'); // Import MySQL pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdefaultbalance')
        .setDescription('Set a default balance for all users')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The default balance amount to set for all users')
                .setRequired(true)),

    async execute(interaction) {
        // Role-based permission check
        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            // Use the pool to execute the query
            const [results] = await pool.query('UPDATE users SET balance = ?', [amount]);

            // Reply to confirm the update
            interaction.reply({ content: `Successfully set the default balance for all users to ${amount}!`, ephemeral: true });
        } catch (err) {
            console.error('Error setting default balance:', err);
            interaction.reply({ content: 'An error occurred while setting the default balance. Please try again later.', ephemeral: true });
        }
    }
};
