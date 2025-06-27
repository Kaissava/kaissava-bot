const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const USERS_FILE = "users.json";

// Kullanıcı kaydetme fonksiyonu
function registerUser(user) {
  let users = {};
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }

  if (!users[user.id]) {
    users[user.id] = {
      name: user.first_name,
      level: 1,
      xp: 0,
      coins: 100,
      class: "warrior",
      boost: false,
      wallet: "",
      banned: false,
      tasks: [],
      inventory: [],
      items_owned: 0,
      completed_tasks: [],
      claimed_tasks: []
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  }
  return false;
}

// /start komutu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const isNew = registerUser(user);

  if (isNew) {
    bot.sendMessage(chatId, `🎉 Hoş geldin ${user.first_name}! KAISSAVA'ya başarıyla kayıt oldun!`);
  } else {
    bot.sendMessage(chatId, `✅ Zaten kayıtlısın, tekrar hoş geldin ${user.first_name}!`);
  }
});

// /play komutu - WebApp başlatma butonu
bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const baseUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, "");
  const webAppUrl = `https://webapp-tr3a.onrender.com/index.html?user_id=${userId}`;

  bot.sendMessage(chatId, "🎮 Oyunu başlatmak için aşağıdaki butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🕹️ KAISSAVA'yı Başlat", web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// /pvp komutu - rakip seçimi ve savaş
bot.onText(/\/pvp (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const opponentUsername = match[1].replace('@', '').trim();

  // users.json'dan kullanıcıları oku
  let users = {};
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }

  // Kullanıcı ID'si bulma (kullanıcı adı ile)
  const opponentEntry = Object.entries(users).find(([id, user]) => user.name.toLowerCase() === opponentUsername.toLowerCase());

  if (!opponentEntry) {
    bot.sendMessage(chatId, "Rakip bulunamadı veya henüz kayıtlı değil.");
    return;
  }

  const opponentId = opponentEntry[0];

  // Basit PvP sonucu: rastgele kazanan
  const user = users[userId];
  const opponent = users[opponentId];

  if (!user || !opponent) {
    bot.sendMessage(chatId, "Kullanıcı bilgileri bulunamadı.");
    return;
  }

  if (user.banned || opponent.banned) {
    bot.sendMessage(chatId, "Engellenmiş kullanıcılar savaşamaz.");
    return;
  }

  const entryFee = user.level < 10 ? 5 : 0;
  if (user.coins < entryFee) {
    bot.sendMessage(chatId, `Yetersiz coin! PvP için ${entryFee} coin gerekir.`);
    return;
  }

  user.coins -= entryFee;

  const winner = Math.random() < 0.5 ? user : opponent;
  const loser = winner === user ? opponent : user;

  const xpEarned = Math.floor(Math.random() * 20) + 10;
  const coinsEarned = Math.floor(Math.random() * 50) + 25;
  const possibleItems = ["iron_sword", "steel_armor", "magic_gloves"];
  const newItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];

  winner.xp += xpEarned;
  winner.coins += coinsEarned;

  if (!winner.inventory.includes(newItem)) {
    winner.inventory.push(newItem);
  }

  const newLevel = Math.floor(winner.xp / 50) + 1;
  const leveledUp = newLevel > winner.level;
  if (leveledUp) winner.level = newLevel;

  users[userId] = user;
  users[opponentId] = opponent;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  bot.sendMessage(chatId, `${winner.name} kazandı! 🎉\nXP: ${xpEarned}\nCoin: ${coinsEarned}\nYeni eşya: ${newItem}\nSeviye: ${winner.level}${leveledUp ? " (Seviye atladı!)" : ""}`);
});
