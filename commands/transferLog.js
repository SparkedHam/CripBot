const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../utils/mysql');  // Assuming your MySQL setup is exported as a promise-based pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferlog')
        .setDescription('View the latest credit transfers'),

    async execute(interaction) {
        try {
            // Query the database using `await` and promise-based pool.query
            const [results] = await pool.query('SELECT * FROM transfers ORDER BY timestamp DESC LIMIT 10');

            if (results.length === 0) {
                return interaction.reply({ content: 'No transfers found.', ephemeral: true });
            }

            // Create an embed to display the transfer logs
            const embed = new EmbedBuilder()
                .setTitle('Recent Credit Transfers')
                .setColor(0x00FF00)
                .setDescription(results.map(transfer =>
                    `**${transfer.giver_username}** gave **${transfer.amount}** credits to **${transfer.receiver_username}** at ${transfer.timestamp}`
                ).join('\n\n'));

            // Send the embed as a response
            return interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error fetching transfer log:', error);
            return interaction.reply({ content: 'An error occurred while retrieving the transfer log.', ephemeral: true });
        }
    }
};
