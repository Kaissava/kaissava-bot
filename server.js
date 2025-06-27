const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

function getLeagueName(level) {
  if (level >= 10) return "Şampiyonlar Ligi";
  if (level === 9) return "9. Lig";
  if (level === 8) return "8. Lig";
  if (level === 7) return "7. Lig";
  if (level === 6) return "6. Lig";
  if (level === 5) return "5. Lig";
  if (level === 4) return "4. Lig";
  if (level === 3) return "3. Lig";
  if (level === 2) return "2. Lig";
  return "1. Lig";
}

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Kullanıcı bilgisi alma
app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  const user = users[userId];

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }
});

// Market verisi
app.get("/api/market", (req, res) => {
  const items = [
    { id: "iron_sword", name: "🗡️ Iron Sword", price: 30 },
    { id: "steel_armor", name: "🦺 Steel Armor", price: 50 },
    { id: "magic_gloves", name: "🧤 Magic Gloves", price: 40 }
  ];
  res.json(items);
});

// Görevler API
app.get("/api/tasks/:id", (req, res) => {
  const userId = req.params.id;
  const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  const allTasks = JSON.parse(fs.readFileSync("tasks.json", "utf-8"));

  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  const response = user.tasks.map(taskId => {
    const taskDef = allTasks[taskId];
    if (!taskDef) return null;

    return {
      id: taskId,
      description: taskDef.description,
      reward: taskDef.reward,
      completed: user.completed_tasks.includes(taskId),
      claimed: (user.claimed_tasks && user.claimed_tasks.includes(taskId)) || false
    };
  }).filter(t => t !== null);

  res.json(response);
});

// PvP İşlemi
app.post("/api/pvp/:id", express.json(), (req, res) => {
  const userId = req.params.id;
  const { opponentId } = req.body;
  const usersPath = "users.json";
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const user = users[userId];
  const opponent = users[opponentId];

  if (!user || !opponent) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }

  if (user.banned || opponent.banned) {
    return res.status(403).json({ error: "Bir kullanıcı engellenmiş durumda." });
  }

  const entryFee = user.level < 10 ? 5 : 0;
  if (user.coins < entryFee) {
    return res.status(403).json({ error: `Yetersiz coin! PvP için ${entryFee} coin gerekir.` });
  }

  user.coins -= entryFee;

  // Basit PvP mekanizması: Random kazanan
  const winner = Math.random() < 0.5 ? user : opponent;
  const loser = winner === user ? opponent : user;

  // Ödüller
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

  // Güncelle
  users[userId] = user;
  users[opponentId] = opponent;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({
    message: `${winner.name} kazandı!`,
    winnerId: winner === user ? userId : opponentId,
    loserId: winner === user ? opponentId : userId,
    xp: xpEarned,
    coins: coinsEarned,
    item: newItem,
    level: winner.level,
    leveledUp,
    league: getLeagueName(winner.level),
    entryFee
  });
});

app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
