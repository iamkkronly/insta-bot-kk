# © Kaustav Ray

import os
import tempfile
import yt_dlp
from pymongo import MongoClient
from gridfs import GridFS
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters

# === CONFIGURATION ===
BOT_TOKEN = "7978136092:AAHTEKdATbnj1ZL9DXdjXeOEyi39XG4EGmA"
MONGO_URI = "mongodb+srv://xz21iwsb:iL8k1OGOqZCjhuvQ@cluster0.hwdnc9j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# ======================

client = MongoClient(MONGO_URI)
db = client["insta_bot"]
fs = GridFS(db)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📥 Send a public Instagram video, reel, or story link to download.")

def is_instagram_link(url: str) -> bool:
    return any(domain in url for domain in ["instagram.com/reel", "instagram.com/p", "instagram.com/stories"])

async def handle_instagram(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()

    if not is_instagram_link(url):
        await update.message.reply_text("❌ Please send a valid Instagram video, reel, or story link.")
        return

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            ydl_opts = {
                'outtmpl': os.path.join(tmpdir, '%(id)s.%(ext)s'),
                'quiet': True,
                'format': 'best',
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                downloaded_path = ydl.prepare_filename(info)

            # Upload to MongoDB
            with open(downloaded_path, "rb") as f:
                file_id = fs.put(f, filename=os.path.basename(downloaded_path))

            # Retrieve and send
            grid_out = fs.get(file_id)
            await update.message.reply_video(video=grid_out, filename=grid_out.filename)

            # Cleanup
            fs.delete(file_id)

    except Exception as e:
        await update.message.reply_text(f"⚠️ Error downloading: {e}")

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_instagram))
    app.run_polling()
