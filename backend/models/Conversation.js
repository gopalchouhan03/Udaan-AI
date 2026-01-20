const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  mood: { type: String }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [MessageSchema]
}, { timestamps: true });

ConversationSchema.index({ userId: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
