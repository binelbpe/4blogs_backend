const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'sports',
      'politics',
      'space',
      'technology',
      'entertainment',
      'health',
      'science',
      'business',
      'education',
      'travel',
      'food',
      'fashion',
      'art',
      'music',
      'gaming',
      'environment'
    ]
  },
  image: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Add virtual field for counts
articleSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

articleSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

// Enable virtuals in JSON
articleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema); 