const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  const user = req.user;
  res.json({ name: user.name, email: user.email, bio: user.bio });
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  const user = req.user;
  const { name, email, bio } = req.body;
  try {
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.bio = bio ?? user.bio;
    await user.save();
    res.json({ name: user.name, email: user.email, bio: user.bio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

module.exports = router;
