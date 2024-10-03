const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s ping to the API server and WebSocket'),

    async execute(interaction) {
        // Get the WebSocket ping
        const wsPing = interaction.client.ws.ping;

        // Get the API latency (time to respond to the interaction)
        const apiLatencyStart = Date.now();
        await interaction.deferReply();  // Defer reply to measure the API latency
        const apiLatencyEnd = Date.now();
        const apiLatency = apiLatencyEnd - apiLatencyStart;

        // Create embed with ping details
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`**WebSocket Ping:** ${wsPing}ms\n**API Latency:** ${apiLatency}ms`)
            .setColor(0x00FF00);

        // Send the embed in the same channel the command was run in
        await interaction.editReply({ embeds: [embed] });
    }
};
