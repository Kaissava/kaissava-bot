const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = "users.json";

// Statik dosyalar için public klasörü
app.use(express.static("public"));

// Basit anasayfa
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Basit kullanıcı kaydı
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
      coins: 100
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  }
  return false;
}

// Telegram komutları
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

bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const webAppUrl = `https://${process.env.RENDER_EXTERNAL_URL}/index.html?user_id=${userId}`;
  bot.sendMessage(chatId, "🎮 Oyunu başlatmak için aşağıdaki butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🕹️ KAISSAVA'yı Başlat", web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Web sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Web sunucusu çalışıyor: http://localhost:${PORT}`);
});
