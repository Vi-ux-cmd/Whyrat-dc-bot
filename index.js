const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const swearWords = [
    "fuck",
    "fucked",
    "fucking",
    "shit",
    "bitch",
    "dick",
    "pussy",
    "cunt"
];

let swearData = {};
let afkData = {};

if (fs.existsSync('./swears.json')) {
    swearData = JSON.parse(fs.readFileSync('./swears.json'));
}

if (fs.existsSync('./afk.json')) {
    afkData = JSON.parse(fs.readFileSync('./afk.json'));
}

function saveSwears() {
    fs.writeFileSync('./swears.json', JSON.stringify(swearData, null, 2));
}

function saveAfk() {
    fs.writeFileSync('./afk.json', JSON.stringify(afkData, null, 2));
}

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const userId = message.author.id;
    const content = message.content.toLowerCase();

    // =================
    // SWEAR DETECTION
    // =================

    const words = content.split(/\s+/);

    let swearCount = 0;

    for (const word of words) {
        if (swearWords.includes(word)) {
            swearCount++;
        }
    }

    if (swearCount > 0) {

        if (!swearData[userId]) {
            swearData[userId] = {
                total: 0
            };
        }

        swearData[userId].total += swearCount;

        saveSwears();
    }

    // =================
    // RETURN FROM AFK
    // =================

    if (afkData[userId]?.afk) {

        const duration =
            Math.floor((Date.now() - afkData[userId].since) / 1000);

        afkData[userId].afk = false;
        afkData[userId].total += duration;

        saveAfk();

        message.reply(
            `Welcome back! You were AFK for ${duration}s.\n` +
            `Total AFK time: ${afkData[userId].total}s`
        );
    }

    // =================
    // AFK MENTION
    // =================

    const mentioned = message.mentions.users.first();

    if (mentioned && afkData[mentioned.id]?.afk) {

        const duration =
            Math.floor((Date.now() - afkData[mentioned.id].since) / 1000);

        message.reply(
            `${mentioned.username} is AFK.\n` +
            `Away for ${duration}s\n` +
            `Reason: ${afkData[mentioned.id].reason}`
        );
    }

    // =================
    // COMMANDS
    // =================

    if (content === 'm!s') {

        if (!swearData[userId]) {
            swearData[userId] = { total: 0 };
        }

        return message.reply(
            `You have sworn ${swearData[userId].total} times.`
        );
    }

    if (content.startsWith('m!s ')) {

        const target = message.mentions.users.first();

        if (!target) return;

        if (!swearData[target.id]) {
            swearData[target.id] = { total: 0 };
        }

        return message.reply(
            `${target.username} has sworn ${swearData[target.id].total} times.`
        );
    }

    if (content.startsWith('m!afk')) {

        const reason =
            message.content.slice(6).trim() || "No reason";

        afkData[userId] = {
            afk: true,
            since: Date.now(),
            reason,
            total: afkData[userId]?.total || 0
        };

        saveAfk();

        return message.reply(
            `You are now AFK: ${reason}`
        );
    }

    if (content === 'm!afktime') {

        const total = afkData[userId]?.total || 0;

        return message.reply(
            `Your total AFK time is ${total}s`
        );
    }

});

client.login(process.env.TOKEN);
