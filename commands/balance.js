const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your token balance or another user\'s balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance to check')),

    async execute(interaction, connection) {
        if (!connection) {
            console.error('MySQL connection is undefined!');
            return interaction.reply({ content: 'Database connection is not available.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;

        // Query the database for the user's balance
        connection.query('SELECT balance FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error(err); // Log error
                return interaction.reply({ content: 'An error occurred while fetching the balance.', ephemeral: true });
            }

            if (results.length === 0) {
                return interaction.reply({ content: `${targetUser.username} has no tokens yet.`, ephemeral: true });
            } else {
                const balance = results[0].balance;
                return interaction.reply({ content: `${targetUser.username} has ${balance} tokens.`, ephemeral: true });
            }
        });
    }
};
