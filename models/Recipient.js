const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  relationship: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
  },
  notification_preferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    postal_mail: {
      type: Boolean,
      default: false
    }
  },
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: {
    createdAt: 'added_date',
    updatedAt: 'last_updated'
  }
});

// Add index for faster queries
recipientSchema.index({ user_id: 1, email: 1 });

module.exports = mongoose.model('Recipient', recipientSchema); 