var mongoose = require('mongoose');
if (process.env.MONGOLAB_URI) {
	mongoose.connect(process.env.MONGOLAB_URI);
} else {
	mongoose.connect('mongodb://localhost/familytoolbox');
}
