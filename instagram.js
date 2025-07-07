const fetch = require('node-fetch');

async function getInstagramMedia(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();

    const match = html.match(/"display_url":"(https?:\/\/[^"]+)"/);
    if (match) {
      return match[1].replace(/\\u0026/g, '&');
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching Instagram:', error.message);
    return null;
  }
}

module.exports = { getInstagramMedia };
