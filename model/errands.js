var mongoose = require('mongoose');
var errandSchema = new mongoose.Schema({  
  name: String,
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duedate: { type: Date },
  completed: { type: Boolean, default: false },
  priority: { 
    type: String,
    enum: ['Trivial', 'Minor', 'Major', 'Critical', 'Blocker'],
    default: 'Minor'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  schedule: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  }],
  points: {
    need: { type: Number, default: 15 },
    receive: { type: Number, default: 5 },
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('Errand', errandSchema);