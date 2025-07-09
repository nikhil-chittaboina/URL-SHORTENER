// index.js
const express = require('express');
const cors = require('cors');
const app = express();
const { nanoid } = require('nanoid');

const PORT = 5000;
const urlStore = new Map(); // In-memory store

// Logger Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const log = {
    method: req.method,
    path: req.originalUrl,
    time: new Date().toISOString(),
    body: req.body
  };
  console.log('Request Log:', JSON.stringify(log, null, 2));
  next();
});

// API to shorten URL
app.post('/api/shorten', (req, res) => {
  const { originalUrl, validity = 30, shortcode } = req.body;
  if (!originalUrl) return res.status(400).json({ error: 'Original URL is required' });

  let shortId = shortcode || nanoid(6);
  if (urlStore.has(shortId)) return res.status(409).json({ error: 'Shortcode already exists' });

  const expiry = Date.now() + validity * 60 * 1000;
  urlStore.set(shortId, {
    originalUrl,
    expiry,
    clicks: []
  });

  res.json({ shortId });
});

// API to get stats
app.get('/api/urls', (req, res) => {
  const result = Array.from(urlStore.entries()).map(([shortCode, data]) => ({
    shortCode,
    originalUrl: data.originalUrl,
    expiry: new Date(data.expiry).toISOString(),
    clicks: data.clicks
  }));
  res.json(result);
});

// Redirect from short URL
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urlStore.get(shortcode);
  if (!urlData || Date.now() > urlData.expiry) {
    return res.status(404).send('Link expired or not found');
  }

  // Record click info
  urlData.clicks.push({
    timestamp: Date.now(),
    source: req.headers.referer || 'direct',
    location: req.ip
  });

  res.redirect(urlData.originalUrl);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
