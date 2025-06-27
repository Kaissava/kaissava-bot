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
      completed_tasks: []
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

  // Fazladan https:// var mı kontrol et, temizle
  const baseUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, "");

  const webAppUrl = `https://${baseUrl}/index.html?user_id=${userId}`;

  bot.sendMessage(chatId, "🎮 Oyunu başlatmak için aşağıdaki butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🕹️ KAISSAVA'yı Başlat", web_app: { url: webAppUrl } }]
      ]
    }
  });
});
