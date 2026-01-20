const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JournalEntry = require('../models/JournalEntry');

// GET /api/journal - list user's entries (supports search and pagination)
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.skip) || 0);

  const base = { userId: req.user._id };
    let entries;
  if (q) {
      // text search across title, content and tasks
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      entries = await JournalEntry.find({
        ...base,
        $or: [
          { title: regex },
          { content: regex },
          { 'tasks.text': regex }
        ]
      }).sort({ date: -1 }).skip(skip).limit(limit);
    } else {
      entries = await JournalEntry.find(base).sort({ date: -1 }).skip(skip).limit(limit);
    }

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch entries' });
  }
});

// POST /api/journal - create
router.post('/', auth, async (req, res) => {
  const { title, content, tasks, taskCompletion, date } = req.body;
  try {
    // basic validation: require either content or tasks
    const safeTasks = Array.isArray(tasks) ? tasks.map(t => ({ text: String(t.text || '').trim(), completed: !!t.completed, category: t.category || 'general' })).filter(t => t.text) : [];
    if (!content && safeTasks.length === 0) return res.status(400).json({ error: 'Please provide content or at least one task' });

    const entry = await JournalEntry.create({
      userId: req.user._id,
      title: title ? String(title).trim() : '',
      content: content ? String(content) : '',
      tasks: safeTasks,
      taskCompletion: taskCompletion || { total: safeTasks.length, completed: safeTasks.filter(t => t.completed).length },
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error('Journal create error:', err && err.stack ? err.stack : err);
    // Don't leak stack traces to clients in production; return a generic message.
    res.status(500).json({ error: 'Could not create entry' });
  }
});

// PUT /api/journal/:id - update
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await JournalEntry.findOne({ _id: id, userId: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const { title, content, tasks } = req.body;
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content;
    if (tasks !== undefined) entry.tasks = tasks;
    entry.taskCompletion = { total: entry.tasks.length, completed: entry.tasks.filter(t => t.completed).length };
    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update' });
  }
});

// DELETE /api/journal/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await JournalEntry.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete' });
  }
});

module.exports = router;
