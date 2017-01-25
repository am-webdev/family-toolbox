var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var user    = require('../model/users');

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
}

router.all("/*", isAuthenticated, function(req, res, next) {
  res.locals.user = req.user || null;
  
  next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/profile', function(req, res, next) {
	res.format({
		//HTML response will render the index.pug file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
		html: function(){
			res.render('users/edit', {
				title: 'Update user Porfile',
				"user" : req.user
			});
		},
		//JSON response will show all tasks in JSON format
		json: function(){
			res.json(req.user);
		}
	});
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('User').findById(id, function (err, task) {
        //if it isn't found, we are going to repond with 404
        if (err) {
          console.log(id + ' was not found');
          res.status(404)
          var err = new Error('Not Found');
          err.status = 404;
          res.format({
            html: function(){
              next(err);
            },
            json: function(){
             res.json({message : err.status  + ' ' + err});
           }
         });
        //if it is found we continue on
      } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(task);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
          } 
        });
  });

//PUT to update a task by ID
router.put('/profile/:id', function(req, res) {
	var tmp_alias = req.body.alias;

   	//find the document by ID
	mongoose.model('User').findById(req.id, function (err, user) {
		console.log(req.id);
        //update it
        user.update({
        	alias : tmp_alias,
        	updated : Date.now()
        },
        function (err, profileID) {
        	if (err) {
            	res.send("There was a problem updating the information to the database: " + err);
          	} 
          	else {
              	//HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
              	res.format({
                	html: function(){
						res.redirect('/users/profile')
               		},
                	//JSON responds showing the updated values
                	json: function(){
                		res.json(204);
                	}
               	});
            }
          })
      });
 });


module.exports = router;
