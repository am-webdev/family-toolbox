var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
	username: String,
	email: {
		type: Date,
		lowercase: true,
		trim: true,
		index: { unique: true }
	},
	password: String,
	families: [{
		family: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Family'
		},
		role: { 
			type: String,
			enum: ['User', 'Admin']
		},
		points: Number
	}],
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);