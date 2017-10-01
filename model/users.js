var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
	username: {
		type: String,
		unique: true
	},
	password: {
		type: String
	},
	alias: String,
	families: [{
		family: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Family'
		},
		role: {
			type: String,
			enum: ['User', 'Admin'],
			dafault: "User"
		},
		points: Number
	}],
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }
});

User.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', User);
