const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  username: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,           // username olmayabilir
    index: true
  },

  firstName: {
    type: String,
    required: true
  },

  lastName: String,

  warnings: {
    type: Number,
    default: 0,
    min: 0
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

  lastActivity: {
    type: Date,
    default: Date.now
  },

  messageCount: {
    type: Number,
    default: 0,
    min: 0
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
}, {
  timestamps: true   // createdAt ve updatedAt otomatik ekler
});

// Index'ler
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ isBanned: 1 });
userSchema.index({ isMuted: 1 });

// Pre-save middleware (opsiyonel iyileştirmeler)
userSchema.pre('save', function(next) {
  if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
