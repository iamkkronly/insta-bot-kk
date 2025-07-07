const fetch = require('node-fetch');

async function getInstagramMedia(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const html = await res.text();

    // Check for video first
    const videoMatch = html.match(/property="og:video" content="([^"]+)"/);
    if (videoMatch) {
      return { type: 'video', url: videoMatch[1] };
    }

    // Then check for image
    const imageMatch = html.match(/property="og:image" content="([^"]+)"/);
    if (imageMatch) {
      return { type: 'photo', url: imageMatch[1] };
    }

    return null;
  } catch (err) {
    console.error('Error fetching media:', err.message);
    return null;
  }
}

module.exports = { getInstagramMedia };
