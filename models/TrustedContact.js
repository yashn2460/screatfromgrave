const mongoose = require('mongoose');

const verificationDocumentSchema = new mongoose.Schema({
  document_type: {
    type: String,
    enum: ['id', 'professional_license', 'death_certificate'],
    required: true
  },
  document_url: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verified_date: {
    type: Date
  }
});

const trustedContactSchema = new mongoose.Schema({
  // contact_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true
  // },
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
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  profession: {
    type: String
  },
  // verification_documents: [verificationDocumentSchema],
  permissions: {
    can_verify_death: {
      type: Boolean,
      default: false
    },
    can_release_messages: {
      type: Boolean,
      default: false
    },
    can_modify_recipients: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'suspended'],
    default: 'pending'
  },
  last_contact: {
    type: Date
  },
  emergency_contact: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'added_date',
    updatedAt: 'last_updated'
  }
});

// Add indexes for faster queries
// trustedContactSchema.index({ user_id: 1, contact_id: 1 }, { unique: true });
// trustedContactSchema.index({ email: 1 });

module.exports = mongoose.model('TrustedContact', trustedContactSchema); 