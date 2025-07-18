const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: true
    },
    destination: {
      type: String,
      required: true,
      maxlength: 60
    },
    days: {
      type: Number,
      required: true,
      min: 1,
      max: 14
    },
    style: {
      type: String,
      enum: ['relaxed', 'balanced', 'adventure'],
      default: 'balanced'
    },
    budget: {
      type: String,
      enum: ['budget', 'standard', 'luxury'],
      default: 'standard'
    },
    theme: {
      type: String,
      enum: ['nature', 'history', 'foodie', 'nightlife'],
      default: 'general'
    },

    planMarkdown: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

itinerarySchema.index(
  { user: 1, tour: 1, destination: 1, days: 1, style: 1 },
  { unique: false }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);
