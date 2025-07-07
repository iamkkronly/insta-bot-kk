const { Telegraf } = require('telegraf');
const express = require('express');
const { getInstagramMedia } = require('./instagram');

const BOT_TOKEN = '7978136092:AAFg6ju52M4LKc7hMALvqaqSI2_BsKu3veo'; // << REPLACE this

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

const userHistory = new Map();

bot.start((ctx) => {
  ctx.reply('👋 Send an Instagram link to download the media.');
});

bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();
  const userId = ctx.from.id;

  if (!url.includes('instagram.com')) {
    return ctx.reply('❌ Please send a valid Instagram link.');
  }

  const mediaUrl = await getInstagramMedia(url);

  if (mediaUrl) {
    await ctx.reply('✅ Media found! Downloading...');
    await ctx.replyWithPhoto({ url: mediaUrl });
  } else {
    await ctx.reply('⚠️ Could not download media. It may be private or invalid.');
  }

  // Save up to 5 messages per user
  const history = userHistory.get(userId) || [];
  history.push(url);
  if (history.length > 5) history.shift();
  userHistory.set(userId, history);
});

app.get('/', (req, res) => {
  res.send('🤖 Telegram Instagram Bot is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

bot.launch();
