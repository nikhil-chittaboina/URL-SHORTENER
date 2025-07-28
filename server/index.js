// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { nanoid } = require('nanoid');
const log = require('./logger');  // custom logger middleware

const PORT = 5000;
const urlStore = new Map(); // In-memory store

// Standard middlewares
app.use(cors());
app.use(express.json());

// Request logging: log each incoming request via remote log API
app.use((req, res, next) => {
  log('backend', 'info', 'request', `Endpoint ${req.method} ${req.originalUrl} hit`);
  next();
});

// API to shorten URL
app.post('/api/shorten', (req, res) => {
  const { originalUrl, validity = 30, shortcode } = req.body;
  if (!originalUrl) {
    log('backend', 'error', 'shorten', 'Original URL is required');
    return res.status(400).json({ error: 'Original URL is required' });
  }

  let shortId = shortcode || nanoid(6);
  if (urlStore.has(shortId)) {
    log('backend', 'error', 'shorten', `Shortcode collision: ${shortId}`);
    return res.status(409).json({ error: 'Shortcode already exists' });
  }

  const expiry = Date.now() + validity * 60 * 1000;
  urlStore.set(shortId, { originalUrl, expiry, clicks: [] });
  log('backend', 'info', 'shorten', `Created shortId ${shortId} for URL ${originalUrl}`);

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
  log('backend', 'info', 'stats', 'Fetched all URL stats');
  res.json(result);
});

// Redirect from short URL
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urlStore.get(shortcode);
  if (!urlData || Date.now() > urlData.expiry) {
    log('backend', 'error', 'redirect', `Shortcode not found or expired: ${shortcode}`);
    return res.status(404).send('Link expired or not found');
  }

  // Record click info
  const click = { timestamp: Date.now(), source: req.headers.referer || 'direct', location: req.ip };
  urlData.clicks.push(click);
  log('backend', 'info', 'redirect', `Redirecting ${shortcode}, click recorded`);

  res.redirect(urlData.originalUrl);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  log('backend', 'info', 'server', `Server started on port ${PORT}`);
});
