const express = require('express');
const path = require('path');
const cron = require('node-cron');
const db = require('./services/firebase');
const { fetchAndStoreNews } = require('./services/newsFetcher.js');
const app = express();

// Use the port provided by the hosting environment, or default to 5000 locally
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and serve static frontend files from 'public' folder
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory or database mock store for synchronized RSS articles
let cachedNewsArticles = [
  {
    id: 1,
    title: "Sheryl Crow Delivers Stunning Performance and Receives Widespread Acclaim",
    source: "Sound & Stage Intelligence",
    category: "Artist Spotlight",
    publishedAt: new Date().toISOString(),
    summary: "Reflecting on decades of chart-topping hits, monumental world tours, and her esteemed Rock and Roll Hall of Fame legacy.",
    url: "https://en.wikipedia.org/wiki/Sheryl_Crow",
    imageUrl: "images/sheryl1.jpg"
  },
  {
    id: 2,
    title: "Inside the Timeless Songwriting Mastery of 'Tuesday Night Music Club'",
    source: "Music Press Live",
    category: "Music Press",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    summary: "A deep dive into how Sheryl Crow's multi-platinum debut album redefined modern rock, blues, and pop culture.",
    url: "https://www.billboard.com/music/music-news/sheryl-crow-hollywood-bowl-power-outage-concert-review-6656775/",
    imageUrl: "images/sheryl2.jpg"
  }
];

// API Endpoint to serve live/cached news to the frontend
app.get('/api/news', (req, res) => {
  res.json(cachedNewsArticles);
});

// =====================================================================
// AUTOMATED BACKGROUND NEWS SYNCHRONIZATION VIA NODE-CRON (Runs 24/7)
// =====================================================================
// Expression '0 */2 * * *' triggers the synchronization task every 2 hours
cron.schedule('0 */2 * * *', async () => {
  try {
    console.log("[Node-Cron Sync] Running scheduled check for automated news updates...");
    
    // Calls your actual fetcher function with your database instance
    await fetchAndStoreNews(db);

    console.log("[Node-Cron Sync] News feeds successfully updated.");
  } catch (err) {
    console.error("[Node-Cron Sync Error] Failed to refresh RSS feeds:", err);
  }
});

// Fallback route to serve index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Sound & Stage Media server is live and running on port ${PORT}`);
  
  // Trigger initial fetch if you have it here
  if (typeof fetchAndStoreNews === 'function') {
    fetchAndStoreNews(db);
  }
});