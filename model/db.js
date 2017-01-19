var mongoose = require('mongoose');
if (process.env.MONGOLAB_URI != '') {
	mongoose.connect('mongodb://localhost/familytoolbox');
} else {
	mongoose.connect(process.env.MONGOLAB_URI);
}
