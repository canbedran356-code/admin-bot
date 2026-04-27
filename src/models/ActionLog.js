const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  groupId: Number,
  userId: Number,
  username: String,
  action: {
    type: String,
    enum: ['ban', 'unban', 'warn', 'unwarn', 'mute', 'unmute', 'kick', 'join', 'leave'],
    required: true
  },
  reason: String,
  adminId: Number,
  adminUsername: String,
  duration: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

actionLogSchema.index({ groupId: 1, timestamp: -1 });
actionLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActionLog', actionLogSchema);