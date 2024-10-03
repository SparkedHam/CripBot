const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setradio')
        .setDescription('Sets a custom radio frequency')
        .addStringOption(option =>
            option.setName('frequency')
                .setDescription('The radio frequency to set (e.g., 123.45)')
                .setRequired(true)),

    async execute(interaction) {
        const radioFrequency = interaction.options.getString('frequency');
        const radioChannel = interaction.guild.channels.cache.get(process.env.RADIO_CHANNEL_ID);

        if (!radioChannel) return interaction.reply({ content: 'Channel not found', ephemeral: true });

        const radioRegex = /^\d{2,3}\.\d{2}$/;
        if (!radioRegex.test(radioFrequency)) {
            return interaction.reply({ content: 'Invalid radio frequency format. Please use the format XXX.XX.', ephemeral: true });
        }

        const [part1, part2] = radioFrequency.split('.');
        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        const embed = new EmbedBuilder()
            .setTitle('Set Radio')
            .setDescription(`Radio frequency set to: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        await radioChannel.send({ content: '@everyone', embeds: [embed] });
        await interaction.reply({ content: `Radio frequency successfully set to ${radioFrequency}`, ephemeral: true });
    }
};
