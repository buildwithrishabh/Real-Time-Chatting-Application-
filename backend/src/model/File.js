const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true,
      unique: true
    },
    size: {
      type: Number, // in bytes
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    duration: {
      type: Number // Audio/Video details
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    virusScanStatus: {
      type: String,
      enum: ['unscanned', 'passed', 'failed'],
      default: 'unscanned',
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true // Optional TTL cleanup of temp files
    }
  },
  {
    timestamps: true
  }
);

const File = mongoose.model('File', FileSchema);
module.exports = File;