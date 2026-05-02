const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== STORAGE =====
const afkUsers = new Map();
const badWords = ["badword", "fuck", "shit"];

// ===== READY =====
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== MESSAGE EVENT =====
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  // ===== PERMISSION CHECK =====
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  const isOwner = message.guild.ownerId === message.author.id;

  // ===== REMOVE AFK WHEN USER RETURNS =====
  if (afkUsers.has(message.author.id)) {
    const afkTime = afkUsers.get(message.author.id);
    const diff = Date.now() - afkTime;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    afkUsers.delete(message.author.id);

    if (hours > 0) {
      message.reply(`👋 Welcome back! You were AFK for ${hours} hour(s).`);
    } else {
      message.reply(`👋 Welcome back! You were AFK for ${minutes} minute(s).`);
    }
  }

  // ===== SET AFK =====
  if (msg.startsWith("afk")) {
    afkUsers.set(message.author.id, Date.now());
    return message.reply("😴 You are now AFK.");
  }

  // ===== MENTION AFK USERS =====
  message.mentions.users.forEach(user => {
    if (afkUsers.has(user.id)) {
      const afkTime = afkUsers.get(user.id);
      const diff = Date.now() - afkTime;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        message.reply(`⏰ ${user.username} is AFK for ${hours} hour(s).`);
      } else {
        message.reply(`⏰ ${user.username} is AFK for ${minutes} minute(s).`);
      }
    }
  });

  // ===== AUTO REPLIES =====
  if (msg === "hi" || msg === "hello") {
    return message.reply("👋 Hello!");
  }

  if (msg === "food") {
    return message.reply("🍔 Here is your food!");
  }

  // ===== BAD WORD FILTER (SAFE) =====
  if (!isAdmin && !isOwner) {
    if (badWords.some(word => msg.includes(word))) {
      try {
        await message.delete();
        return message.channel.send(`🚫 ${message.author}, avoid bad language.`);
      } catch {}
    }
  }

  // ===== BAN =====
  if (msg.startsWith("!ban")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ No permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user.");

    if (user.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply("❌ Cannot ban higher/equal role.");
    }

    user.ban();
    return message.channel.send("🚫 User banned.");
  }

  // ===== MUTE =====
  if (msg.startsWith("!mute")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ No permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user.");

    if (user.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply("❌ Cannot mute higher/equal role.");
    }

    const role = message.guild.roles.cache.find(r => r.name === "Muted");
    if (!role) return message.reply("❌ Create 'Muted' role first.");

    user.roles.add(role);
    return message.channel.send("🔇 User muted.");
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
