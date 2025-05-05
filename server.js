// server.js
require('dotenv').config();                   // Load .env first
console.log('🔑 MONGODB_URI =', process.env.MONGODB_URI);

const express   = require('express');
const mongoose  = require('mongoose');
const multer    = require('multer');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── RATE LIMITER ──────────────────────────────────────────────────────────────
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,                     // limit each IP to 5 submissions per window
  message: {
    message: 'Too many submissions from this IP, please try again after 15 minutes.'
  }
});

// ─── MONGOOSE MODEL ────────────────────────────────────────────────────────────
const memeRequestSchema = new mongoose.Schema({
  description:   String,
  memeType:      String,
  memeFormat:    String,
  file:          String,
  walletAddress: String,
  status:        { type: String, default: 'Pending' },
}, { timestamps: true });

const MemeRequest = mongoose.model('MemeRequest', memeRequestSchema);

// ─── FILE UPLOAD SETUP ─────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  })
});

// ─── CONNECT TO MONGODB ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// POST /submit-meme → save a new meme request (with rate limiting)
app.post(
  '/submit-meme',
  submitLimiter,
  upload.single('file'),
  async (req, res) => {
    try {
      const { description, memeType, memeFormat, walletAddress } = req.body;
      const file = req.file ? req.file.filename : '';
      const mr = new MemeRequest({ description, memeType, memeFormat, file, walletAddress });
      await mr.save();
      res.json({ message: 'Meme request submitted!' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to submit meme request.' });
    }
  }
);

// GET /get-user-requests/:walletAddress → fetch that user's requests
app.get('/get-user-requests/:walletAddress', async (req, res) => {
  try {
    const list = await MemeRequest
      .find({ walletAddress: req.params.walletAddress })
      .sort('-createdAt');
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load user requests.' });
  }
});

// ─── START THE SERVER ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
