const mongoose = require('mongoose');

const MoodInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  inferredMood: { type: String },
  score: { type: Number },
  completionRate: { type: Number },
  averageSleep: { type: Number },
  moodTriggers: [String],
  message: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MoodInsight', MoodInsightSchema);