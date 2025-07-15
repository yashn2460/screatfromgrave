// EmailTemplate model: Stores customizable email templates for notifications, admin messages, etc.
// Admins can manage these templates via the admin API.
const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true, // e.g., 'death_verification_notification', 'contact_notification', etc.
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema); 