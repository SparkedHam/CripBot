const { SlashCommandBuilder } = require('discord.js');
const { generateNewRadio } = require('../utils/radio.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newradio')
        .setDescription('Generate a new radio frequency and set it'),
    async execute(interaction) {
        const footerText = `Requested by: ${interaction.user.username}`;
        await generateNewRadio(interaction.client, footerText);
        await interaction.reply({ content: `New radio frequency set.`, ephemeral: true });
    }
};
