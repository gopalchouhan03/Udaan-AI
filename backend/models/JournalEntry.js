const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  // Frontend-friendly fields
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  mood: { type: Number, min: 1, max: 5 },
  moodLabel: { type: String },
  notes: { type: String },
  tags: [String],
  sleepHours: { type: Number },
  energyLevel: { type: Number },
  // Tasks stored with entry (optional)
  tasks: [
    {
      text: { type: String },
      completed: { type: Boolean, default: false },
      category: { type: String, default: 'general' }
    }
  ],
  taskCompletion: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

// Ensure userId + date is unique
// NOTE: removed unique index on (userId, date) because exact-date uniqueness
// at millisecond precision can cause accidental duplicate-key errors when
// frontend provides normalized dates or multiple entries are created quickly.
// If you want to enforce one-entry-per-day, implement a normalized-day key
// (e.g. dateOnly: YYYY-MM-DD) and index that instead.
// JournalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
