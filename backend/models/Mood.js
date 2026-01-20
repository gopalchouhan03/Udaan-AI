const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  note: { type: String },
  source: { type: String, enum: ['tracker','chat','journal','task'], default: 'tracker' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Mood', MoodSchema);
