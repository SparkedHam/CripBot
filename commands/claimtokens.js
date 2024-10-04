const moment = require('moment');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claimtokens')
        .setDescription('Claim your hourly tokens'),

    async execute(interaction, connection) {
        const userId = interaction.user.id;
        const currentTime = new Date();

        connection.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                connection.query('INSERT INTO users (id, username, balance, last_claim) VALUES (?, ?, ?, ?)', [userId, interaction.user.username, 100000, currentTime], (err) => {
                    if (err) throw err;
                    interaction.reply({ content: 'You have successfully claimed 100000 tokens!', ephemeral: true });
                });
            } else {
                const lastClaim = results[0].last_claim ? moment(results[0].last_claim) : null;
                const timeDifference = lastClaim ? moment().diff(lastClaim, 'hours') : 1;

                if (timeDifference >= 1) {
                    connection.query('UPDATE users SET balance = balance + 100000, last_claim = ? WHERE id = ?', [currentTime, userId], (err) => {
                        if (err) throw err;
                        interaction.reply({ content: 'You have successfully claimed 100000 tokens!', ephemeral: true });
                    });
                } else {
                    interaction.reply({ content: 'You can only claim tokens once every 1 hour. Please try again later.', ephemeral: true });
                    console.log(`User ${userId} tried to claim tokens before the cooldown period. Last claim was ${timeDifference} hours ago.`);
                }
            }
        });
    }
};
