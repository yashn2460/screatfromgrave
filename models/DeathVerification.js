const mongoose = require('mongoose');

const deathVerificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trustee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrustedContact',
    required: true
  },
  verification_type: {
    type: String,
    enum: ['manual', 'scheduled', 'automatic'],
    default: 'manual'
  },
  verification_method: {
    type: String,
    enum: ['death_certificate', 'medical_report', 'official_document', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verification_date: {
    type: Date
  },
  death_date: {
    type: Date,
    required: true
  },
  place_of_death: {
    type: String
  },
  death_certificate_url: {
    type: String
  },
  verification_notes: {
    type: String
  },
  required_trustees: {
    type: Number,
    default: 1
  },
  verified_trustees: [{
    trustee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustedContact'
    },
    verification_date: {
      type: Date,
      default: Date.now
    },
    verification_notes: String,
    verification_method: {
      type: String,
      enum: ['death_certificate', 'medical_report', 'official_document', 'other']
    },
    place_of_death: String
  }],
  scheduled_verification_date: {
    type: Date
  },
  auto_verify_after_days: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

// Index for faster queries
deathVerificationSchema.index({ user_id: 1, status: 1 });
deathVerificationSchema.index({ scheduled_verification_date: 1 });
deathVerificationSchema.index({ trustee_id: 1 });

module.exports = mongoose.model('DeathVerification', deathVerificationSchema); 