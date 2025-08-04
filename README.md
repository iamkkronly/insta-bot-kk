# Instagram Downloader Telegram Bot

Telegram bot that downloads Instagram videos (Reels, Posts, Stories) using `yt-dlp`,
stores them in MongoDB GridFS, sends to the user, and deletes the file after delivery.

## Deploy on Render

1. Upload this folder to GitHub.
2. Create a **new Render Web Service**:
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python bot.py`

## Configuration

- `BOT_TOKEN`: Your Telegram bot token
- `MONGO_URI`: Your MongoDB Atlas URI
