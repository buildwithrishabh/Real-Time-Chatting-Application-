const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blockedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Ensures blockers can block a specific user only once
BlockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const BlockedUser = mongoose.model('BlockedUser', BlockedUserSchema);
module.exports = BlockedUser;