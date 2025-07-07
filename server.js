const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN = '7978136092:AAFg6ju52M4LKc7hMALvqaqSI2_BsKu3veo';

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

const userHistory = new Map();

bot.start((ctx) => {
  ctx.reply('👋 Welcome! Send a public Instagram post link to download photo or video.');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const url = ctx.message.text.trim();

  if (!url.includes('instagram.com')) {
    return ctx.reply('❌ Please send a valid Instagram post link.');
  }

  try {
    // Proxy API to get direct media link
    const response = await axios.get(`https://ig-api-4g7u.onrender.com/api?url=${encodeURIComponent(url)}`);
    const { type, url: mediaUrl } = response.data;

    if (!mediaUrl) {
      return ctx.reply('⚠️ Unable to extract media. Try another link.');
    }

    await ctx.reply('✅ Media found! Sending...');

    // Download media into memory
    const fileRes = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(fileRes.data, 'binary');

    if (type === 'photo') {
      await ctx.replyWithPhoto({ source: buffer });
    } else if (type === 'video') {
      await ctx.replyWithVideo({ source: buffer });
    } else {
      await ctx.reply(`⚠️ Unknown media type. Here's the link:\n${mediaUrl}`);
    }

    // Save user history (last 5)
    const logs = userHistory.get(userId) || [];
    logs.push(url);
    if (logs.length > 5) logs.shift();
    userHistory.set(userId, logs);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await ctx.reply('❌ Failed to fetch or send media. Try another link.');
  }
});

app.get('/', (req, res) => {
  res.send('🤖 Instagram Downloader Bot is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

bot.launch();
