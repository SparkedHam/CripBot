require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'newradio') {
        const channelID = '1202015979962376225'; // Replace with the channel ID

        const radioChannel = interaction.guild.channels.cache.get(channelID);

        if (!radioChannel) return interaction.reply({ content: "Channel not found", ephemeral: true });

        // Generate the radio number
        const part1 = Math.floor(Math.random() * (999 - 20 + 1)) + 20;
        const part2 = Math.floor(Math.random() * 100);
        const radioFrequency = `${part1}.${part2 < 10 ? '0' + part2 : part2}`;

        // Set new channel name
        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('New Radio')
            .setDescription(`New Radio Frequency: ${radioFrequency}`)
            .setColor(0x00FF00);

        // Send embed to the channel by ID
        await radioChannel.send({ content: '@everyone', embeds: [embed] });

        await interaction.reply({ content: `New radio frequency set to ${radioFrequency}`, ephemeral: true });
    }
});

// Register the slash command
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands('1291165127394983970'),
            { body: [
                    new SlashCommandBuilder()
                        .setName('newradio')
                        .setDescription('Sets a new radio frequency in the predefined channel')
                ] },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.login(process.env.DISCORD_TOKEN);
