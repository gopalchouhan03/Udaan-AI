const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Mood = require('../models/Mood');

// Helper: parse incoming mood payloads (frontend may send { mood } or { value })
const extractValue = (body) => {
  if (body == null) return undefined;
  if (typeof body.value === 'number') return body.value;
  if (typeof body.mood === 'number') return body.mood;
  // allow strings that parse to numbers
  if (typeof body.value === 'string' && body.value.trim() !== '' && !Number.isNaN(Number(body.value))) return Number(body.value);
  if (typeof body.mood === 'string' && body.mood.trim() !== '' && !Number.isNaN(Number(body.mood))) return Number(body.mood);
  return undefined;
};

// POST /api/mood - create mood entry
router.post('/', auth, async (req, res) => {
  try {
    const value = extractValue(req.body);
    const note = req.body.note || req.body.notes || '';
    const date = req.body.date ? new Date(req.body.date) : new Date();

    if (typeof value !== 'number' || Number.isNaN(value)) {
      return res.status(400).json({ error: 'Mood value required (number)' });
    }

    const mood = await Mood.create({ user: req.user._id, value, note, date });
    return res.status(201).json(mood);
  } catch (err) {
    console.error('Could not save mood', err);
    return res.status(500).json({ error: 'Could not save mood' });
  }
});

// GET /api/mood - list moods for user with optional pagination
// query params: ?limit=50&skip=0
router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const moods = await Mood.find({ user: req.user._id }).sort({ date: -1 }).skip(skip).limit(limit);
    return res.json(moods);
  } catch (err) {
    console.error('Could not fetch moods', err);
    return res.status(500).json({ error: 'Could not fetch moods' });
  }
});

// GET /api/mood/stats - simple stats (average) over last N days
// ?days=14
router.get('/stats', auth, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await Mood.find({ user: req.user._id, date: { $gte: since } });
    if (!Array.isArray(docs) || docs.length === 0) return res.json({ count: 0, average: 0 });
    const sum = docs.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const avg = sum / docs.length;
    return res.json({ count: docs.length, average: avg, days });
  } catch (err) {
    console.error('Could not fetch mood stats', err);
    return res.status(500).json({ error: 'Could not fetch mood stats' });
  }
});

module.exports = router;
