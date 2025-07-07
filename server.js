const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');

// ✅ API keys inserted directly
const TELEGRAM_BOT_TOKEN = '7703394411:AAHhzdoMr07gUlGjlTFTQdPHoczRCa8WOB0';
const REMOVE_BG_API_KEY = 'DkspPLqQGPu1FfeeWJfg7i6j';

const app = express();
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Render keeps web service alive
app.get('/', (req, res) => {
  res.send('✅ Background Remover Telegram Bot is running!');
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server started on Render');
});

// Main background removal logic
bot.on('photo', async (ctx) => {
  try {
    await ctx.reply('⏳ Removing background...');

    const photo = ctx.message.photo.pop(); // get highest quality
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    // Fetch image
    const imageResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    // Send to Remove.bg
    const form = new FormData();
    form.append('image_file', Buffer.from(imageResp.data), 'image.jpg');
    form.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
      headers: {
        ...form.getHeaders(),
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      responseType: 'arraybuffer'
    });

    // Reply with result
    await ctx.replyWithPhoto({ source: Buffer.from(response.data) }, { caption: '✅ Background removed!' });

  } catch (err) {
    console.error('❌ Error:', err.message);
    ctx.reply('⚠️ Something went wrong. Please try again.');
  }
});

// Launch the bot
bot.launch();
