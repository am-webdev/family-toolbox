var mongoose = require('mongoose');
var taskSchema = new mongoose.Schema({  
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
  duedate: { type: Date},
  completed: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('Task', taskSchema);