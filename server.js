const { Telegraf } = require('telegraf');
const express = require('express');
const { getInstagramMedia } = require('./instagram');

const BOT_TOKEN = '7978136092:AAFg6ju52M4LKc7hMALvqaqSI2_BsKu3veo'; // 🔴 Replace this with your actual bot token

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

const userHistory = new Map();

bot.start((ctx) => {
  ctx.reply('👋 Welcome! Send a public Instagram post link (photo or video) to download it.');
});

bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();
  const userId = ctx.from.id;

  if (!url.includes('instagram.com')) {
    return ctx.reply('❌ Please send a valid Instagram post URL.');
  }

  const media = await getInstagramMedia(url);

  if (media) {
    await ctx.reply('✅ Media found! Sending...');
    if (media.type === 'photo') {
      await ctx.replyWithPhoto({ url: media.url });
    } else if (media.type === 'video') {
      await ctx.replyWithVideo({ url: media.url });
    }
  } else {
    await ctx.reply('⚠️ Could not download media. It may be private, deleted, or restricted.');
  }

  // Store user history
  const logs = userHistory.get(userId) || [];
  logs.push(url);
  if (logs.length > 5) logs.shift();
  userHistory.set(userId, logs);
});

app.get('/', (req, res) => {
  res.send('🤖 Telegram Instagram Bot is Running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

bot.launch();
