const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  bio: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
