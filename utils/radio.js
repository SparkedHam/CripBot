const { EmbedBuilder } = require('discord.js');

async function generateNewRadio(client, footerText = null) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.error('Guild not found');

    const radioChannel = guild.channels.cache.get(process.env.RADIO_CHANNEL_ID);
    if (!radioChannel) return console.error('Channel not found');

    const part1 = Math.floor(Math.random() * (500 - 20 + 1)) + 20;
    const part2 = Math.floor(Math.random() * 100);
    const radioFrequency = `${part1}.${part2 < 10 ? '0' + part2 : part2}`;

    await radioChannel.setName(`📻・radio-${part1}-${part2 < 10 ? '0' + part2 : part2}`);

    const embed = new EmbedBuilder()
        .setTitle('New Radio')
        .setDescription(`New Radio Frequency: **${radioFrequency}**`)
        .setColor(0x99FFFF)
        .setFooter({ text: footerText || 'Requested by: Automatically generated' });

    await radioChannel.send({ content: '@everyone', embeds: [embed] });
}

module.exports = { generateNewRadio };
