const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetbalance')
        .setDescription('Reset the balance of a user to a default value')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance to reset')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The default balance amount to set')
                .setRequired(true)),

    async execute(interaction, connection) {
        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        connection.query('UPDATE users SET balance = ? WHERE id = ?', [amount, targetUser.id], (err) => {
            if (err) throw err;
            interaction.reply({ content: `Successfully reset ${targetUser.username}'s balance to ${amount}!`, ephemeral: true });
        });
    }
};
