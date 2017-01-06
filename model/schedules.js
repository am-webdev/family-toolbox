var mongoose = require('mongoose');
var scheduleSchema = new mongoose.Schema({  
  name: String,
  _parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  meta_key: String,
  meta_value: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
mongoose.model('Schedule', scheduleSchema);