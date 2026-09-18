const axios = require('axios');
const cron = require('node-cron');

const stockPhotos = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540039155-9814cb5da83?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
];

async function fetchAndStoreNews(db) {
  try {
    console.log("Syncing widespread music intelligence & live feeds...");
    
    const feeds = [
      { url: 'https://news.google.com/rss/search?q=Sheryl+Crow&hl=en-US&gl=US&ceid=US:en', category: 'Artist Spotlight' },
      { url: 'https://news.google.com/rss/search?q=new+music+release+album+single&hl=en-US&gl=US&ceid=US:en', category: 'Music Press' },
      { url: 'https://news.google.com/rss/search?q=music+industry+gossip+and+news&hl=en-US&gl=US&ceid=US:en', category: 'Industry News' },
      { url: 'https://news.google.com/rss/search?q=Billboard+Hot+100+top+artists&hl=en-US&gl=US&ceid=US:en', category: 'Music Press' },
      { url: 'https://news.google.com/rss/search?q=Grammy+winning+artists+news&hl=en-US&gl=US&ceid=US:en', category: 'Artist Spotlight' },
      { url: 'https://news.google.com/rss/search?q=global+concert+tours+music+festivals&hl=en-US&gl=US&ceid=US:en', category: 'Industry News' }
    ];

    let totalSynced = 0;
    let stockIndex = 0;

    for (const feed of feeds) {
      try {
        const response = await axios.get(feed.url, { responseType: 'text' });
        const items = response.data.match(/<item>([\s\S]*?)<\/item>/g) || [];
        let count = 0;

        for (const item of items) {
          if (count >= 15) break; // Pulls a healthy batch per category

          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
          const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
          
          const imageMatch = item.match(/<enclosure[^>]*url="([^"]+)"/i) || 
                             item.match(/<media:content[^>]*url="([^"]+)"/i) ||
                             item.match(/img[^>]+src="([^">]+)"/i);

          const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[\vert{}\]\]>/g, '').trim() : 'No Title';
          const url = linkMatch ? linkMatch[1].trim() : '#';
          const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
          const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[\vert{}\]\]>/g, '').trim() : 'Global Media';

          const imageUrl = imageMatch ? imageMatch[1] : stockPhotos[stockIndex % stockPhotos.length];
          stockIndex++;

          const articleData = {
            title,
            url,
            summary: `Read full developing coverage regarding ${title} via ${source}. Stay updated with real-time industry tracking and media insights.`,
            source,
            category: feed.category,
            publishedAt,
            imageUrl
          };

          const articleData1 = {
            title,
            url,
            summary: `Read full developing coverage regarding ${title} via ${source}. Stay updated with real-time industry tracking and media insights.`,
            source,
            category: feed.category,
            publishedAt,
            imageUrl
          };

          // Use Firestore's auto-generated unique ID or a safe hash to prevent overwriting
          await db.collection('celebrity_news').add(articleData);
          count++;
          totalSynced++;
        }
      } catch (feedErr) {
        console.error(`Error fetching feed ${feed.category}:`, feedErr.message);
      }
    }

    // AUTOMATIC CLEANUP: Keep only the freshest 50 articles, remove the oldest to prevent crowding
    const snapshot = await db.collection('celebrity_news').orderBy('publishedAt', 'desc').get();
    if (snapshot.size > 50) {
      const docsToDelete = snapshot.docs.slice(50); // Everything past the top 50
      const batch = db.batch();
      docsToDelete.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[Cleanup] Pruned ${docsToDelete.length} older articles to keep the feed fresh.`);
    }

    console.log(`Successfully synced ${totalSynced} articles to Firestore.`);
  } catch (err) {
    console.error("Error in news fetcher pipeline:", err.message);
  }
}

function initNewsCron(db) {
  cron.schedule('0 */2 * * *', async () => {
    console.log("[Node-Cron] Triggering scheduled automated news update...");
    await fetchAndStoreNews(db);
  });
  console.log("[Node-Cron] Automated news scheduler successfully activated (Every 2 hours).");
}

module.exports = { fetchAndStoreNews, initNewsCron };