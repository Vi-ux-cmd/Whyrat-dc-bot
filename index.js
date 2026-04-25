const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const afk = new Map();
const badWords = ["badword", "fuck", "shit"];

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  // AFK system
  if (afk.has(message.author.id)) {
    afk.delete(message.author.id);
    message.reply("👋 Welcome back!");
  }

  if (msg === "afk") {
    afk.set(message.author.id, true);
    return message.reply("😴 You are now AFK");
  }

  // Auto replies
  if (msg === "hi" || msg === "hello") {
    return message.reply("👋 Hello! How can I help you?");
  }

  // Bad word filter
  if (badWords.some(w => msg.includes(w))) {
    message.delete().catch(() => {});
    return message.channel.send("🚫 Please avoid bad language");
  }

  // Ban command
  if (msg.startsWith("!ban")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ No permission to ban");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user");

    user.ban();
    return message.channel.send("🚫 User banned");
  }

  // Mute command
  if (msg.startsWith("!mute")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ No permission to mute");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user");

    const role = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!role) return message.reply("Create 'Muted' role first");

    user.roles.add(role);
    return message.channel.send("🔇 User muted");
  }

  // Block links + images
  if (message.attachments.size > 0 || msg.includes("http")) {
    message.delete().catch(() => {});
    return message.channel.send("🚫 Not allowed");
  }
});

client.login(process.env.TOKEN);
