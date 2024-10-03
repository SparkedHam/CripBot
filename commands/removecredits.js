const { SlashCommandBuilder } = require('discord.js');

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

    async execute(interaction, connection) {
        // Role-based permission check
        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        // Check if the user is valid
        connection.query('SELECT * FROM users WHERE id = ?', [targetUser.id], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                interaction.reply({ content: `${targetUser.username} does not have an account yet.`, ephemeral: true });
            } else {
                // Ensure balance doesn't go negative
                const currentBalance = results[0].balance;
                const newBalance = currentBalance - amount;

                if (newBalance < 0) {
                    interaction.reply({ content: `${targetUser.username} does not have enough credits.`, ephemeral: true });
                } else {
                    connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, targetUser.id], (err) => {
                        if (err) throw err;
                        interaction.reply({ content: `Successfully removed ${amount} credits from ${targetUser.username}!`, ephemeral: true });
                    });
                }
            }
        });
    }
};
