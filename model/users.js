var mongoose = require('mongoose');  
var taskSchema = new mongoose.Schema({  
  alias: String,
  email: String,
  password: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('User', userSchema);