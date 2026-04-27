const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: String,
  firstName: String,
  lastName: String,

  warnings: {
    type: Number,
    default: 0
  },

  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banDate: Date,

  isMuted: {
    type: Boolean,
    default: false
  },
  muteUntil: Date,
  muteReason: String,

  joinDate: {
    type: Date,
    default: Date.now
  },

  lastActivity: Date,

  messageCount: {
    type: Number,
    default: 0
  },

  warningHistory: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String,
        default: "Belirtilmemiş"
      },
      admin: {
        id: Number,
        username: String
      }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
