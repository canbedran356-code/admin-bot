const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  groupName: String,
  groupUsername: String,
  welcomeEnabled: {
    type: Boolean,
    default: true
  },
  welcomeMessage: String,
  goodbyeEnabled: {
    type: Boolean,
    default: true
  },
  goodbyeMessage: String,
  memberCount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    autoWarn: { type: Boolean, default: true },
    autoBanOnWarn: { type: Boolean, default: true },
    warnLimit: { type: Number, default: 3 },
    antiSpam: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('Group', groupSchema);