const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Mood = require('../models/Mood');

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task({
      userId: req.user._id,
      ...req.body
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create task' });
  }
});

// Get all tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, dueDate } = req.query;
    let query = { userId: req.user._id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by priority if provided
    if (priority) {
      query.priority = priority;
    }

    // Filter by dueDate if provided
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch tasks' });
  }
});

// Update task status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, userId: req.user._id });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update status and set completedAt if being marked as completed
    const prevStatus = task.status;
    if (req.body.status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
    }

    // Apply updates
    Object.assign(task, req.body);
    await task.save();

    // If status changed, create a small mood event derived from task completion
    try {
      if (prevStatus !== task.status) {
        // Determine base mood: latest mood value if available, else neutral 3
        const lastMood = await Mood.findOne({ user: req.user._id }).sort({ date: -1 });
        const base = lastMood ? Number(lastMood.value || 3) : 3;

        let newValue = base;
        let note = '';
        let source = 'task';

        if (task.status === 'completed') {
          // small boost on completion
          newValue = Math.min(5, Math.round(base) + 1);
          note = `Mood boost: completed task "${task.title}"`;
        } else if (task.status === 'pending') {
          // small drop when task reopened/uncompleted
          newValue = Math.max(1, Math.round(base) - 1);
          note = `Mood change: task re-opened "${task.title}"`;
        }

        // Persist the mood entry so charts pick up the change
        await Mood.create({ user: req.user._id, value: newValue, note, date: new Date(), source });
      }
    } catch (mErr) {
      // don't fail the request if mood persistence fails
      console.warn('Could not persist task-driven mood event', mErr && mErr.message ? mErr.message : mErr);
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete task' });
  }
});

module.exports = router;