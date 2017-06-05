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

//build the REST operations at the base for families
//this will be accessible from http://127.0.0.1:3000/families if the default route for / is left unchanged
router.route('/')
    //GET all families
    .get(function(req, res, next) {
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
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.pug file in the views/families folder. We are also setting "families" to be an accessible variable in our jade view
                      html: function(){
                        res.render('families/index', {
                          title: 'All my families',
                          "families_userrole": req.user.populate('families').populate('families'),
                          "families" : families
                        });
                      },
                    //JSON response will show all families in JSON format
                    json: function(){
                      res.json(families);
                    }
                  });
                }     
              });
      })
    //POST a new family
    .post(function(req, res) {
        var tmp_name = req.body.name;
        var tmp_description = req.body.description;
        var tmp_owner = req.user;
        var tmp_duedate = req.body.duedate;
        var tmp_completed = req.body.completed;

        mongoose.model('Family').create({
          name : tmp_name,
          description : tmp_description,
          owner : tmp_owner,
          duedate : tmp_duedate,
          completed : tmp_completed,
        }, function (err, family) {
        if (err) {
          res.send("There was a problem adding the information to the database."+err);
        } else {
          //family has been created
          console.log('POST creating new family: ' + family);

          mongoose.model('User').findByIdAndUpdate(
            req.user._id,
            {$push: {families: {
                family: family.id,
                role: 'Admin',
                points: 0
              }}},
            {safe: true, upsert: true},
            function(err, user) {
              console.log(err);
            }
          );

          res.format({
              html: function(){
                res.location("families");
                res.redirect("/families");
              },
            json: function(){
              res.json(family);
            }
          });
        }
      })
    });


    /* GET New task page. */
    router.get('/new', function(req, res) {
      res.render('families/new', { title: 'Add New Family' });
    });


module.exports = router;
