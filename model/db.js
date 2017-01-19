var mongoose = require('mongoose');
if (app.get('env') === 'local') {
	mongoose.connect('mongodb://localhost/familytoolbox');
} else {
	mongoose.connect(process.env.MONGOLAB_URI);
}
