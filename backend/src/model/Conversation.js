const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
      index: true
    },
    name: {
      type: String,
      default: '' // Only populated for group chats
    },
    avatarUrl: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true // Group creator or transfer target
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Optimization index to load chat listings by latest activity
ConversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
module.exports = Conversation;