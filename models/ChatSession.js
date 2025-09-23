const mongoose = require('mongoose');

// Chat Message Schema 
const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant'],
  },
  text: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  ts: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, { _id: false });

// Chat Session Schema 
const chatSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'Conversation',
  },
  messages: {
    type: [chatMessageSchema],
    required: true,
    default: [],
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  toJSON: { 
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;