require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the cors package
const mongoose = require('mongoose'); // Import Mongoose
const { nanoid } = require('nanoid');
const log = require('./logger'); // custom logger middleware (assuming you have this file)

const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI; // MongoDB connection string from environment variables

if (!MONGODB_URI) {
  log('backend', 'error', 'database', 'MONGODB_URI is not defined in environment variables.');
  process.exit(1); // Exit if no database URI is provided
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    log('backend', 'info', 'database', 'Connected to MongoDB successfully!');
    // Start the server only after successful database connection
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      log('backend', 'info', 'server', `Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    log('backend', 'error', 'database', `MongoDB connection error: ${err.message}`);
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if database connection fails
  });

// --- Mongoose Schema and Model ---
const urlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true, // Ensures short codes are unique
  },
  originalUrl: {
    type: String,
    required: true,
  },
  expiry: {
    type: Date, // Store expiry as a Date object
    required: true,
  },
  clicks: {
    type: [{
      timestamp: { type: Date, default: Date.now },
      source: String,
      location: String,
    }],
    default: [], // Initialize as an empty array
  },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps automatically

const Url = mongoose.model('Url', urlSchema); // Create the Url model

// --- Standard middlewares ---

// Configure CORS to explicitly allow your frontend's origin
// Replace 'https://url-shortener-1-git-main-nikhil-chittaboina-projects.vercel.app'
// with the actual URL of your deployed frontend on Vercel.
const allowedOrigins = [
  'https://url-shortener-1-git-main-nikhil-chittaboina-projects.vercel.app',
  'http://localhost:5173', // <--- ADDED THIS LINE FOR YOUR LOCAL FRONTEND
  'http://localhost:3000', // Common React dev server port, good to include
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow common HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow headers your frontend might send
  credentials: true // Set to true if your frontend sends cookies or authorization headers
}));

app.use(express.json()); // Middleware to parse JSON request bodies

// Request logging: log each incoming request via remote log API
app.use((req, res, next) => {
  // Ensure 'log' function is defined, e.g., in a logger.js file
  // If you don't have a logger.js, you can remove this middleware or define a simple log function.
  if (typeof log === 'function') {
    log('backend', 'info', 'request', `Endpoint ${req.method} ${req.originalUrl} hit`);
  } else {
    console.log(`Endpoint ${req.method} ${req.originalUrl} hit`);
  }
  next();
});

// API to shorten URL
app.post('/api/shorten', async (req, res) => {
  const { originalUrl, validity = 30, shortcode } = req.body; // validity in minutes
  if (!originalUrl) {
    if (typeof log === 'function') log('backend', 'error', 'shorten', 'Original URL is required');
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    let shortId = shortcode || nanoid(6);

    // Check if custom shortcode already exists
    if (shortcode) {
      const existingUrl = await Url.findOne({ shortCode: shortId });
      if (existingUrl) {
        if (typeof log === 'function') log('backend', 'error', 'shorten', `Custom shortcode collision: ${shortId}`);
        return res.status(409).json({ error: 'Custom shortcode already exists. Please choose another.' });
      }
    } else {
      // For auto-generated shortcodes, ensure uniqueness (unlikely with nanoid, but good practice)
      let uniqueShortIdFound = false;
      while (!uniqueShortIdFound) {
        const existingUrl = await Url.findOne({ shortCode: shortId });
        if (!existingUrl) {
          uniqueShortIdFound = true;
        } else {
          shortId = nanoid(6); // Generate a new one if collision
        }
      }
    }

    const expiryDate = new Date(Date.now() + validity * 60 * 1000); // Calculate expiry date

    const newUrl = new Url({
      shortCode: shortId,
      originalUrl,
      expiry: expiryDate,
      clicks: [], // Ensure clicks are initialized
    });

    await newUrl.save(); // Save the new URL to the database
    if (typeof log === 'function') log('backend', 'info', 'shorten', `Created shortId ${shortId} for URL ${originalUrl} in DB`);

    res.status(201).json({ shortId }); // 201 Created status
  } catch (err) {
    if (typeof log === 'function') log('backend', 'error', 'shorten', `Error shortening URL: ${err.message}`);
    console.error('Error shortening URL:', err);
    res.status(500).json({ error: 'Internal server error during URL shortening.' });
  }
});

// API to get stats
app.get('/api/urls', async (req, res) => {
  try {
    const urls = await Url.find({}); // Fetch all URLs from the database
    const result = urls.map(url => ({
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      expiry: url.expiry.toISOString(), // Convert Date to ISO string for consistency
      clicks: url.clicks,
    }));
    if (typeof log === 'function') log('backend', 'info', 'stats', 'Fetched all URL stats from DB');
    res.json(result);
  } catch (err) {
    if (typeof log === 'function') log('backend', 'error', 'stats', `Error fetching URL stats: ${err.message}`);
    console.error('Error fetching URL stats:', err);
    res.status(500).json({ error: 'Internal server error fetching statistics.' });
  }
});

// Redirect from short URL
app.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  try {
    const urlData = await Url.findOne({ shortCode }); // Find URL by short code
    if (!urlData) {
      if (typeof log === 'function') log('backend', 'error', 'redirect', `Shortcode not found: ${shortcode}`);
      return res.status(404).send('Link not found');
    }

    if (Date.now() > urlData.expiry.getTime()) { // Check expiry
      if (typeof log === 'function') log('backend', 'warn', 'redirect', `Shortcode expired: ${shortcode}`);
      // Optionally, you could delete the expired URL here: await Url.deleteOne({ shortCode });
      return res.status(410).send('Link expired'); // 410 Gone for expired resources
    }

    // Record click info
    const click = {
      timestamp: new Date(), // Use Date object for consistency
      source: req.headers.referer || 'direct',
      location: req.ip || 'unknown', // IP might not be available directly in some environments
    };
    urlData.clicks.push(click);
    await urlData.save(); // Save the updated clicks array

    if (typeof log === 'function') log('backend', 'info', 'redirect', `Redirecting ${shortcode}, click recorded in DB`);

    res.redirect(urlData.originalUrl);
  } catch (err) {
    if (typeof log === 'function') log('backend', 'error', 'redirect', `Error redirecting for ${shortcode}: ${err.message}`);
    console.error('Error during redirection:', err);
    res.status(500).send('Internal server error during redirection.');
  }
});

// No longer need app.listen here, it's moved inside the mongoose.connect .then() block
