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

//build the REST operations at the base for tasks
//this will be accessible from http://127.0.0.1:3000/tasks if the default route for / is left unchanged
router.route('/')
    //GET all tasks
    .get(function(req, res, next) {
        //retrieve all tasks from Monogo
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
                      //HTML response will render the index.pug file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
                      html: function(){
                        res.render('families/index', {
                          title: 'All my families',
                          "families_userrole": req.user.populate('families'),
                          "families" : families
                        });
                      },
                    //JSON response will show all tasks in JSON format
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

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    mongoose.model('Family').findById(id, function (err, task) {
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
            req.id = id;
            next(); 
          } 
        });
  });

router.route('/:id').get(function(req, res) {
  mongoose.model('Family').findById(req.id, function (err, family) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      console.log('GET Retrieving ID: ' + req.id);
        res.format({
          json: function(){
            res.json(family);
          },
          html: function(){
            res.render('families/show', {
              "family" : family
            });
          }
        });
      }
    }).populate("owner").populate("members");
});

router.route('/:id').put(function(req, res) {
    var tmp_name = req.body.name;
    var tmp_description = req.body.description;

   //find the document by ID
   mongoose.model('Family').findById(req.id, function (err, family) {
            //update it
            family.update({
              name : tmp_name,
              description : tmp_description,
              updated : Date.now()
            }, function (err, familyID) {
              if (err) {
                res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds
                      res.format({
                        html: function(){
                         res.redirect("/families/" + family.id);
                       },
                         //JSON responds
                         json: function(){
                           res.json(family);
                         }
                       });
                    }
                  })
          }).populate("owner").populate("member");
 });

//GET the individual family by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the family within Mongo
    mongoose.model('Family').findById(req.id, function (err, family) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
            //Return the family
            console.log('GET Retrieving ID: ' + family.id);
            console.log(family);
          res.format({
                 //JSON response will return the JSON output
                 json: function(){
                   res.json(family);
                 },
                //HTML response will render the 'edit.pug' template
                html: function(){
                 res.render('families/edit', {
                  title: 'family' + family.id,
                  "family" : family
                });
               }
             });
        }
      }).populate("owner").populate("members");
  });

//DELETE a family by ID
router.delete('/:id', function (req, res){
  mongoose.model('Family').findById(req.id, function (err, family) {
    if (err) {
      return console.error(err);
    } else {
          family.remove(function (err, family) {
            if (err) {
              return console.error(err);
            } else {
                  console.log('DELETE removing ID: ' + family.id);
                  res.format({
                      //HTML return
                      html: function(){
                       res.redirect("/families");
                     },
                       //JSON return
                       json: function(){
                         res.json({message : 'deleted',
                           item : family
                         });
                       }
                     });
                }
              });
        }
      }).populate("owner").populate("assignee");
});
module.exports = router;
