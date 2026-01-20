const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JournalEntry = require('../models/JournalEntry');
const Task = require('../models/Task');
const MoodInsight = require('../models/MoodInsight');
const Mood = require('../models/Mood');
const reverseMoodMap = {
  7: '😊 Happy',
  6: '😌 Calm',
  5: '🔥 Motivated',
  3: '😞 Sad',
  2: '😟 Anxious',
  1: '💤 Burnt Out'
};

// Function to infer mood based on multiple factors
function inferMood({ mood, completionRate, sleepHours }) {
  const moodScore = 0.6 * (mood / 5) + 
                    0.2 * completionRate + 
                    0.1 * Math.min(1, sleepHours / 8);

  if (moodScore > 0.75) return 'Happy';
  if (moodScore > 0.5) return 'Neutral';
  return 'Stressed';
}

// Function to find mood triggers based on journal content and task data
async function analyzeMoodTriggers(userId, startDate, endDate) {
  // Get journal entries for the period
  const entries = await JournalEntry.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  // Get tasks for the period
  const tasks = await Task.find({
    userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Analyze patterns
  const triggers = [];

  // Check workload impact
  const tasksPerDay = tasks.length / 7;
  if (tasksPerDay > 5) {
    triggers.push('High Workload');
  }

  // Check sleep impact
  const avgSleep = entries.reduce((acc, entry) => acc + (entry.sleepHours || 0), 0) / entries.length;
  if (avgSleep < 7) {
    triggers.push('Sleep');
  }

  // Check task completion impact
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = tasks.length ? completedTasks / tasks.length : 0;
  if (completionRate < 0.5) {
    triggers.push('Low Task Completion');
  }

  return triggers;
}

// Generate insights based on last 7 days of data
router.get('/', auth, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Get journal entries for the period
    const entries = await JournalEntry.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get tasks relevant to the period. Include tasks that were either created during
    // the period or completed during the period so status changes (completions)
    // affect the completionRate even if the task was created earlier.
    const tasks = await Task.find({
      userId: req.user._id,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { completedAt: { $gte: startDate, $lte: endDate } }
      ]
    });

    // Also fetch Mood entries (frontend MoodTracker saves to Mood model)
    const moodDocs = await Mood.find({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });

    // Calculate average mood (prefer explicit Mood entries; fallback to journal entries)
    const avgMood = (moodDocs.length
      ? moodDocs.reduce((acc, m) => acc + (m.value || 3), 0) / moodDocs.length
      : (entries.length
          ? entries.reduce((acc, entry) => acc + (entry.mood || 3), 0) / entries.length
          : 3)); // default neutral mood when no entries

    // Calculate task completion rate
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length ? completedTasks / tasks.length : 0;

  // Get mood triggers (analyzeMoodTriggers now handles empty entries)
  const topTriggers = await analyzeMoodTriggers(req.user._id, startDate, endDate);

    // Generate personalized message
    let message = '';
    if (topTriggers.includes('High Workload')) {
      message = "You tend to be stressed when having many tasks. Consider spreading work more evenly.";
    } else if (topTriggers.includes('Sleep')) {
      message = "Low sleep hours seem to affect your mood. Try maintaining a consistent sleep schedule.";
    } else if (topTriggers.includes('Low Task Completion')) {
      message = "Completing tasks boosts your mood. Try breaking large tasks into smaller ones.";
    } else {
      message = "Your mood and productivity are in good balance this week.";
    }

    // Save insight
    const averageSleep = entries.length
      ? entries.reduce((acc, entry) => acc + (entry.sleepHours || 0), 0) / entries.length
      : 7; // sensible default

    const insight = new MoodInsight({
      userId: req.user._id,
      date: endDate,
      inferredMood: inferMood({ mood: avgMood, completionRate, sleepHours: averageSleep }),
      score: avgMood,
      completionRate,
      averageSleep,
      moodTriggers: topTriggers,
      message
    });
    await insight.save();

    // Return insight data
    // Prefer chart data from Mood documents (MoodTracker writes here). If none, fall back to journal entries.
    const chartSource = moodDocs.length ? moodDocs : entries;
    const chartData = chartSource.map(e => ({
      date: e.date,
      mood: (e.value || e.mood || 0),
      energy: e.energyLevel || null,
      sleep: e.sleepHours || null
    }));

    res.json({
      averageMood: avgMood,
      completionRate,
      topTriggers,
      message,
      chartData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate insights' });
  }
});

// GET /api/insights/mood-trends?days=14
router.get('/mood-trends', auth, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 14));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await Mood.find({ user: req.user._id, date: { $gte: since } });
    // Group by value
    const counts = docs.reduce((acc, d) => {
      const k = String(d.value || 0);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const result = Object.keys(counts).map(k => ({ value: Number(k), count: counts[k], tag: reverseMoodMap[k] || 'Other' }));
    res.json({ days, total: docs.length, distribution: result });
  } catch (err) {
    console.error('Could not fetch mood trends', err);
    res.status(500).json({ error: 'Could not fetch mood trends' });
  }
});

module.exports = router;
