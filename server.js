const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');
const { getInstagramMedia } = require('./instagram');

const BOT_TOKEN = '7978136092:AAFg6ju52M4LKc7hMALvqaqSI2_BsKu3veo';

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

const userHistory = new Map();

bot.start((ctx) => {
  ctx.reply('👋 Send a public Instagram post (image or video) URL to download.');
});

bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();
  const userId = ctx.from.id;

  if (!url.includes('instagram.com')) {
    return ctx.reply('❌ Please send a valid Instagram post URL.');
  }

  const media = await getInstagramMedia(url);

  if (media && media.url) {
    console.log('Media URL:', media.url);
    await ctx.reply('✅ Media found! Sending...');

    try {
      const response = await axios.get(media.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const buffer = Buffer.from(response.data, 'binary');

      if (media.type === 'photo') {
        await ctx.replyWithPhoto({ source: buffer });
      } else if (media.type === 'video') {
        await ctx.replyWithVideo({ source: buffer });
      }
    } catch (error) {
      console.error('❌ Error sending media:', error.message);
      await ctx.reply(`❌ Telegram couldn't send the media.\n📎 Open in browser:\n${media.url}`);
    }
  } else {
    await ctx.reply('⚠️ Could not download media. It may be private or invalid.');
  }

  // Store up to 5 URLs per user
  const logs = userHistory.get(userId) || [];
  logs.push(url);
  if (logs.length > 5) logs.shift();
  userHistory.set(userId, logs);
});

app.get('/', (req, res) => {
  res.send('🤖 Instagram Telegram Bot is Running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

bot.launch();
