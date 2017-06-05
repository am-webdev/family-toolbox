var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var user = require('../model/users');

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
}

router.all("/*", isAuthenticated, function(req, res, next) {
  res.locals.user = req.user || null;
  next();
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
router.get('/profile', function(req, res, next) {
  //retrieve all families from Monogo
  var userFamilyIds = [];
  for (var crnFam in req.user.families) {
    userFamilyIds.push(req.user.families[crnFam].family);
  }
  mongoose.model('Family').find({
            '_id': { $in: userFamilyIds}
        }, function (err, families) {
          if (err) {
            return console.error(err);
          } else {
          	res.format({
          		//HTML response will render the index.pug file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
          		html: function(){
          			res.render('users/edit', {
          				title: 'Update user Porfile',
          				"user" : req.user,
                  "families_userrole": req.user.populate('families.family'),
                  "families" : families
          			});
          		},
          		//JSON response will show all tasks in JSON format
          		json: function(){
          			res.json(req.user);
          		}
          	});
          };
  });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    mongoose.model('User').findById(id, function (err, task) {
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
      } else {
            // once validation is done save the new item in the req
            req.id = id;
            next(); 
          } 
        });
  });

//PUT to update a user by ID
router.put('/profile/:id', function(req, res) {
	var tmp_alias = req.body.alias;

   	//find by ID
     mongoose.model('User').findById(req.id, function (err, user) {
      if (req.user.id != req.id) {
        res.json(403);
      }
        //update it
        user.update({
        	alias : tmp_alias,
        	updated : Date.now()
        },
        function (err) {
        	if (err) {
           res.send("There was a problem updating the information to the database: " + err);
         } 
         else {
              	//HTML responds redirect to the profile page
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