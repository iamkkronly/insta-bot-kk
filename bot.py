# © Kaustav Ray

import os
import tempfile
import subprocess
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
    await update.message.reply_text("📥 Send a public Instagram reel, post, or story link.")

def is_instagram_link(url: str) -> bool:
    return any(part in url for part in ["instagram.com/reel", "instagram.com/p", "instagram.com/stories"])

async def handle_instagram(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()

    if not is_instagram_link(url):
        await update.message.reply_text("❌ Please send a valid Instagram link.")
        return

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            command = [
                "yt-dlp",
                "-f", "best",
                "-o", os.path.join(tmpdir, "%(id)s.%(ext)s"),
                url
            ]
            result = subprocess.run(command, capture_output=True, text=True)

            if result.returncode != 0:
                await update.message.reply_text(f"⚠️ yt-dlp failed:\n{result.stderr}")
                return

            downloaded_files = [os.path.join(tmpdir, f) for f in os.listdir(tmpdir)]
            if not downloaded_files:
                await update.message.reply_text("⚠️ No media found after download.")
                return

            file_path = downloaded_files[0]

            with open(file_path, "rb") as f:
                file_id = fs.put(f, filename=os.path.basename(file_path))

            grid_out = fs.get(file_id)
            await update.message.reply_video(video=grid_out, filename=grid_out.filename)

            fs.delete(file_id)

    except Exception as e:
        await update.message.reply_text(f"🚫 Error: {str(e)}")

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_instagram))
    app.run_polling()
