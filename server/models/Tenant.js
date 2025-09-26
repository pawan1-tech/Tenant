const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  noteLimit: {
    type: Number,
    default: 3 // Free plan limit
  },
  upgradeRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reason: String
  }
}, {
  timestamps: true
});

// Update noteLimit based on plan
tenantSchema.pre('save', function(next) {
  if (this.plan === 'pro') {
    this.noteLimit = -1; // -1 means unlimited
  } else {
    this.noteLimit = 3; // Free plan limit
  }
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);