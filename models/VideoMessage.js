const mongoose = require('mongoose');

const videoMessageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  file_url: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    required: true,
    enum: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv']
  },
  upload_date: {
    type: Date,
    default: Date.now
  },
  encryption_key: {
    type: String,
    required: true
  },
  recipient_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduled_release: {
    type: Date
  },
  release_conditions: {
    type: {
      type: String,
      enum: ['death_verification', 'date_based', 'manual'],
      default: 'manual'
    },
    verification_required: {
      type: Boolean,
      default: false
    },
    trusted_contacts_required: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VideoMessage', videoMessageSchema); 