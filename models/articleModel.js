const mongoose = require('mongoose');
const { CATEGORIES } = require('../constants/categories');

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
    enum: CATEGORIES
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


articleSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

articleSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

articleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema); 