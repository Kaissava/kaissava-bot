const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();

const USERS_FILE = "./users.json";  // kesin proje köküne göre

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("users.json okunurken hata:", err);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log("users.json başarıyla kaydedildi.");
  } catch (err) {
    console.error("users.json yazılırken hata:", err);
  }
}

function registerUser(user) {
  let users = loadUsers();
  console.log("registerUser çağrıldı:", user.id);

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
      completed_tasks: [],
      claimed_tasks: [],
      inventory: [],
      items_owned: 0,
      equipment: {}
    };
    saveUsers(users);
    console.log("Yeni kullanıcı kaydedildi:", user.id);
    return true;
  }
  console.log("Kullanıcı zaten kayıtlı:", user.id);
  return false;
}

bot.onText(/\/start/, (msg) => {
  console.log("/start komutu alındı:", msg.from.id);
  const chatId = msg.chat.id;
  const user = msg.from;
  const isNew = registerUser(user);

  if (isNew) {
    bot.sendMessage(chatId, `🎉 Hoş geldin ${user.first_name}! KAISSAVA'ya başarıyla kayıt oldun!`);
  } else {
    bot.sendMessage(chatId, `✅ Zaten kayıtlısın, tekrar hoş geldin ${user.first_name}!`);
  }
});

bot.onText(/\/profile/, (msg) => {
  console.log("/profile komutu alındı:", msg.from.id);
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const users = loadUsers();

  const user = users[userId];
  if (!user) {
    bot.sendMessage(chatId, "❌ Profilin bulunamadı. /start komutunu kullanarak kayıt olabilirsin.");
    return;
  }

  const profileMsg = `
🛡️ KAISSAVA Profilin:
Adın: ${user.name}
Seviye: ${user.level}
XP: ${user.xp}
Coin: ${user.coins}
Sınıf: ${user.class}
Envanterinde: ${user.inventory.length} eşya
Ekipmanlar:
  Kılıç: ${user.equipment.sword || "Yok"}
  Zırh: ${user.equipment.chest || "Yok"}
  Eldiven: ${user.equipment.gloves || "Yok"}
  Bot: ${user.equipment.boots || "Yok"}
  Omuz: ${user.equipment.shoulder || "Yok"}
`;

  bot.sendMessage(chatId, profileMsg);
});

bot.onText(/\/play/, (msg) => {
  console.log("/play komutu alındı:", msg.from.id);
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const webAppUrl = `https://webapp-tr3a.onrender.com/index.html?user_id=${userId}`;

  bot.sendMessage(chatId, "🎮 Oyunu başlatmak için aşağıdaki butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🕹️ KAISSAVA'yı Başlat", web_app: { url: webAppUrl } }]
      ]
    }
  });
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});
