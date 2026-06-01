const CHANNEL_ID = 'UCEgEBrgZ089qGkA3ZmumDfQ';

exports.handler = async function () {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
    );
    if (!res.ok) throw new Error(`YouTube feed returned ${res.status}`);

    const xml = await res.text();
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!match) throw new Error('No videos found in feed');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({ videoId: match[1] }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
