const mongoose = require('mongoose');

const CareerSuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  input: {
    interests: { type: String },
    skills: { type: String },
    mindset: { type: String }
  },
  result: { type: Object }, // store full result JSON returned to frontend
  mood: { type: String },
  insight: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerSuggestion', CareerSuggestionSchema);
