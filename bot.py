# © Kaustav Ray

import os
import re
import tempfile
from pymongo import MongoClient
import gridfs
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters
from yt_dlp import YoutubeDL

# === CONFIG ===
BOT_TOKEN = '7978136092:AAHTEKdATbnj1ZL9DXdjXeOEyi39XG4EGmA'
MONGO_URI = 'mongodb+srv://xz21iwsb:iL8k1OGOqZCjhuvQ@cluster0.hwdnc9j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

client = MongoClient(MONGO_URI)
db = client['telegram_bot']
fs = gridfs.GridFS(db)

def is_instagram_url(text):
    return bool(re.search(r'(https?://)?(www\.)?instagram\.com/[^\s]+', text))

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    text = update.message.text
    if not is_instagram_url(text):
        await update.message.reply_text("Please send a valid Instagram link.")
        return

    await update.message.reply_text("Downloading from Instagram...")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            file_path = tmp_file.name

        ydl_opts = {
            'outtmpl': file_path,
            'quiet': True,
            'format': 'best'
        }

        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([text])

        with open(file_path, 'rb') as f:
            mongo_id = fs.put(f, filename=os.path.basename(file_path))

        with fs.get(mongo_id) as f:
            await update.message.reply_video(f.read())

        fs.delete(mongo_id)
        os.remove(file_path)

    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()
