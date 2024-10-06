const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../utils/mysql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top players by their token balance'),

    async execute(interaction) {
        try {
            const [results] = await pool.query('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10');

            const embed = new EmbedBuilder()
                .setTitle('Top 10 Players')
                .setColor(0x00FF00)
                .setDescription(results.map((user, index) => `${index + 1}. ${user.username} - ${user.balance} tokens`).join('\n'));

            return interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            return interaction.reply({ content: 'An error occurred while retrieving the leaderboard.', ephemeral: true });
        }
    }
};
