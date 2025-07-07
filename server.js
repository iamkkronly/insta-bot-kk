const { Telegraf } = require('telegraf');
const express = require('express');
const { getInstagramMedia } = require('./instagram');

// Your Telegram Bot Token here
const BOT_TOKEN = '7978136092:AAFg6ju52M4LKc7hMALvqaqSI2_BsKu3veo';

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
    console.log('Sending media:', media.url);
    await ctx.reply('✅ Media found! Sending...');

    if (media.type === 'photo') {
      try {
        await ctx.replyWithPhoto({ url: media.url });
      } catch (err) {
        console.error('❌ Error sending photo:', err.message);
        await ctx.reply(`❌ Telegram couldn't send this image.\nYou can download it here:\n${media.url}`);
      }
    } else if (media.type === 'video') {
      try {
        await ctx.replyWithVideo({ url: media.url });
      } catch (err) {
        console.error('❌ Error sending video:', err.message);
        await ctx.reply(`❌ Telegram couldn't send this video.\nYou can download it here:\n${media.url}`);
      }
    }
  } else {
    await ctx.reply('⚠️ Could not download media. It may be private, deleted, or restricted.');
  }

  // Store up to 5 recent URLs per user
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
