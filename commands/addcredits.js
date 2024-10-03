const { SlashCommandBuilder } = require('discord.js');

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
                // If user is not found, add them with initial balance
                connection.query('INSERT INTO users (id, username, balance) VALUES (?, ?, ?)', [targetUser.id, targetUser.username, amount], (err) => {
                    if (err) throw err;
                    interaction.reply({ content: `Successfully added ${amount} credits to ${targetUser.username}!`, ephemeral: true });
                });
            } else {
                // Update user balance
                connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, targetUser.id], (err) => {
                    if (err) throw err;
                    interaction.reply({ content: `Successfully added ${amount} credits to ${targetUser.username}!`, ephemeral: true });
                });
            }
        });
    }
};
