var mongoose = require('mongoose');
var familySchema = new mongoose.Schema({  
	name: String,
	description: String,
	owner: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: 'User'
	},
	members: [
		{
		    type: mongoose.Schema.Types.ObjectId,
		    ref: 'User'
		}
	],
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }
});
mongoose.model('Family', familySchema);