
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const USERS_FILE = "users.json";

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

  const webAppUrl = `https://YOUR_CYCLIC_URL_HERE/index.html?user_id=${userId}`;

  bot.sendMessage(chatId, "🎮 Oyunu başlatmak için aşağıdaki butona tıkla:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🕹️ KAISSAVA'yı Başlat", web_app: { url: webAppUrl } }]
      ]
    }
  });
});
