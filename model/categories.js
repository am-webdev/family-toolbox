var mongoose = require('mongoose');
var categorySchema = new mongoose.Schema({  
  name: String,
  color: String,
  icon: Number,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family'
  },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('Category', categorySchema);