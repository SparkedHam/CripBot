require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder, ActivityType} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const radioChannelID = '1202015979962376225'; // Replace with the channel ID

client.once('ready', () => {
    console.log('Bot is online!');

    // Set bot's status to appear online on a mobile device
    client.user.setPresence({
        status: 'dnd', // Status: online, idle, dnd, invisible
        activities: [{
            name: 'Fuck the Saints',
            type: ActivityType.Streaming, // or other activity types like Streaming, Listening, etc.
            url: 'https://youtu.be/dQw4w9WgXcQ?si=rVEdh9HDnU-ptso6'
        }],
        afk: false,
        shardId: [0] // Optional, depending on your setup
    });

    // Simulate mobile status (show as online on a phone)
    client.user.setStatus('online'); // Set status to online
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'newradio') {
        const radioChannel = interaction.guild.channels.cache.get(radioChannelID);

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
            .setDescription(`New Radio Frequency: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        // Send embed to the channel by ID
        await radioChannel.send({ content: '@everyone', embeds: [embed] });

        await interaction.reply({ content: `New radio frequency set to ${radioFrequency}`, ephemeral: true });
    }

    if (commandName === 'ping') {
        // Get the WebSocket ping
        const ping = client.ws.ping;

        // Get the API latency (time to respond to the interaction)
        const apiLatencyStart = Date.now();
        await interaction.deferReply();
        const apiLatencyEnd = Date.now();
        const apiLatency = apiLatencyEnd - apiLatencyStart;

        // Create embed with ping details
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`**WebSocket Ping:** ${ping}ms\n**API Latency:** ${apiLatency}ms`)
            .setColor(0x99FFFF);

        // Send the embed in the same channel the command was run in
        await interaction.editReply({ embeds: [embed] });
    }
    if (commandName === 'setradio') {
        const radioFrequency = interaction.options.getString('frequency');
        const radioChannel = interaction.guild.channels.cache.get(radioChannelID);

        if (!radioChannel) return interaction.reply({ content: "Channel not found", ephemeral: true });

        // Ensure the radio frequency is in the correct format (e.g., 123.45)
        const radioRegex = /^\d{2,3}\.\d{2}$/;
        if (!radioRegex.test(radioFrequency)) {
            return interaction.reply({ content: "Invalid radio frequency format. Please use the format XXX.XX.", ephemeral: true });
        }

        // Set the channel name
        const [part1, part2] = radioFrequency.split('.');
        await radioChannel.setName(`📻・radio-${part1}-${part2}`);

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Set Radio')
            .setDescription(`Radio frequency set to: **${radioFrequency}**`)
            .setColor(0x99FFFF)
            .setFooter({ text: `Requested by: ${interaction.user.username}` });

        // Send embed to the channel
        await radioChannel.send({ content: '@everyone', embeds: [embed] });

        await interaction.reply({ content: `Radio frequency successfully set to ${radioFrequency}`, ephemeral: true });
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
                        .setDescription('Automatically generates a new radio frequency'),
                    new SlashCommandBuilder()
                        .setName('ping')
                        .setDescription('Shows the current bot ping to the API server and WebSocket'),
                    new SlashCommandBuilder()
                        .setName('setradio')
                        .setDescription('Sets a custom radio frequency')
                        .addStringOption(option =>
                            option.setName('frequency')
                                .setDescription('The radio frequency to set (e.g., 123.45)')
                                .setRequired(true))
                ] },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.login(process.env.DISCORD_TOKEN);
