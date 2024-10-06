const { SlashCommandBuilder } = require('discord.js');
const pool = require('../utils/mysql'); // Import MySQL pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givecredits')
        .setDescription('Give credits to another user')
        .addUserOption(option =>
            option.setName('recipient')
                .setDescription('The user to give credits to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of credits to give')
                .setRequired(true)),

    async execute(interaction) {
        const giverId = interaction.user.id;
        const recipient = interaction.options.getUser('recipient');
        const amount = interaction.options.getInteger('amount');

        // Prevent users from sending credits to themselves
        if (giverId === recipient.id) {
            return interaction.reply({ content: 'You cannot give credits to yourself.', ephemeral: true });
        }

        try {
            // Check if the giver has enough balance
            const [giverResults] = await pool.query('SELECT balance FROM users WHERE id = ?', [giverId]);

            if (giverResults.length === 0 || giverResults[0].balance < amount) {
                return interaction.reply({ content: 'You do not have enough credits to give.', ephemeral: true });
            }

            // Check if the recipient exists; if not, create their account
            const [recipientResults] = await pool.query('SELECT * FROM users WHERE id = ?', [recipient.id]);
            if (recipientResults.length === 0) {
                await pool.query('INSERT INTO users (id, username, balance) VALUES (?, ?, ?)', [recipient.id, recipient.username, amount]);
            } else {
                await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, recipient.id]);
            }

            // Deduct the amount from the giver's balance
            await pool.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, giverId]);

            // Reply to confirm the transfer
            return interaction.reply({ content: `Successfully gave ${amount} credits to ${recipient.username}!`, ephemeral: true });

        } catch (err) {
            console.error('Error giving credits:', err);
            return interaction.reply({ content: 'An error occurred while processing the transaction. Please try again later.', ephemeral: true });
        }
    }
};
