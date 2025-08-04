# © Kaustav Ray

import os
import tempfile
import instaloader
from pymongo import MongoClient
from gridfs import GridFS
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

# === CONFIGURATION SECTION ===
BOT_TOKEN = "7978136092:AAF8zNStzGTxyGkJ2n_Bzz4Ue436Tsm0dec"
MONGO_URI = "mongodb+srv://xz21iwsb:iL8k1OGOqZCjhuvQ@cluster0.hwdnc9j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# ==============================

client = MongoClient(MONGO_URI)
db = client["insta_bot"]
fs = GridFS(db)

loader = instaloader.Instaloader(
    dirname_pattern=tempfile.gettempdir(),
    save_metadata=False,
    post_metadata_txt_pattern=""
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📥 Send me any public Instagram post, reel, or story link to download.")

def extract_shortcode(url: str):
    parts = url.strip("/").split("/")
    return next((p for p in parts if len(p) >= 5), None)

async def handle_instagram_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    shortcode = extract_shortcode(url)

    if not shortcode:
        await update.message.reply_text("❌ Invalid Instagram link.")
        return

    try:
        post = instaloader.Post.from_shortcode(loader.context, shortcode)
        loader.download_post(post, target=shortcode)

        # Find media file (.mp4 or .jpg)
        media_file = None
        for f in os.listdir(tempfile.gettempdir()):
            if shortcode in f and (f.endswith(".mp4") or f.endswith(".jpg")):
                media_file = os.path.join(tempfile.gettempdir(), f)
                break

        if not media_file:
            await update.message.reply_text("⚠️ Failed to download media.")
            return

        # Upload to MongoDB
        with open(media_file, "rb") as f:
            file_id = fs.put(f, filename=os.path.basename(media_file))

        # Retrieve and send
        grid_out = fs.get(file_id)
        if media_file.endswith(".mp4"):
            await update.message.reply_video(grid_out, filename=grid_out.filename)
        else:
            await update.message.reply_photo(grid_out, filename=grid_out.filename)

        # Cleanup
        fs.delete(file_id)
        os.remove(media_file)

    except Exception as e:
        await update.message.reply_text(f"🚫 Error: {str(e)}")

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_instagram_link))
    app.run_polling()
