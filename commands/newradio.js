const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newradio')
        .setDescription('Generate a new radio frequency and set it'),

    async execute(interaction) {
        const radioChannel = interaction.guild.channels.cache.get(process.env.RADIO_CHANNEL_ID);

        if (!radioChannel) return interaction.reply({ content: 'Channel not found', ephemeral: true });

        const part1 = Math.floor(Math.random() * (999 - 20 + 1)) + 20;
        const part2 = Math.floor(Math.random() * 100);
        const radioFrequency = `${part1}.${part2 < 10 ? '0' + part2 : part2}`;

        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        const embed = new EmbedBuilder()
            .setTitle('New Radio')
            .setDescription(`New Radio Frequency: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        await radioChannel.send({ content: '@everyone', embeds: [embed] });
        await interaction.reply({ content: `New radio frequency set to ${radioFrequency}`, ephemeral: true });
    }
};
