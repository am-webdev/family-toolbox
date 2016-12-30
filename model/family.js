var mongoose = require('mongoose');
var familySchema = new mongoose.Schema({  
  name: String,
  description: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('Family', familySchema);