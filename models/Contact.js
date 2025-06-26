const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'support', 'technical', 'billing', 'partnership', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'responded', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  admin_notes: {
    type: String,
    trim: true
  },
  response_message: {
    type: String,
    trim: true
  },
  response_date: {
    type: Date
  },
  response_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
contactSchema.index({ status: 1, priority: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ user_id: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });

// Pre-save middleware to set priority based on category
contactSchema.pre('save', function(next) {
  if (this.category === 'technical' || this.category === 'billing') {
    this.priority = 'high';
  } else if (this.category === 'support') {
    this.priority = 'medium';
  } else {
    this.priority = 'low';
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema); 