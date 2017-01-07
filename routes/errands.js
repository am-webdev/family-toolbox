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


//build the REST operations at the base for errands
//this will be accessible from http://127.0.0.1:3000/errands if the default route for / is left unchanged
router.route('/')
    //GET all errands
    .get(function(req, res, next) {
        //retrieve all errands from Monogo
        mongoose.model('Item').find({type: 'Errand'}, function (err, errands) {
          if (err) {
            return console.error(err);
          } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.pug file in the views/errands folder. We are also setting "errands" to be an accessible variable in our jade view
                      html: function(){
                        res.render('errands/index', {
                          title: 'All my errands',
                          "errands" : errands
                        });
                      },
                    //JSON response will show all errands in JSON format
                    json: function(){
                      res.json(errands);
                    }
                  });
                }     
              });
      })
    //POST a new errand
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var tmp_name = req.body.name;
        var tmp_description = req.body.description;
        var tmp_owner = req.user;
        var tmp_assignee = req.body.assignee;
        var tmp_duedate = req.body.duedate;
        var tmp_completed = req.body.completed;

        //call the create function for our database
        mongoose.model('Item').create({
         name : tmp_name,
         description : tmp_description,
         type : "Errand",
         owner : tmp_owner,
         assignee : tmp_assignee,
         duedate : tmp_duedate,
         completed : tmp_completed,
       }, function (err, errand) {
        if (err) {
          res.send("There was a problem adding the information to the database."+err);
        } else {
                  //errand has been created
                  console.log('POST creating new errand: ' + errand);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                      html: function(){
                        // If it worked, set the header
                        res.location("errands");
                        // And forward to success page
                        res.redirect("/errands");
                      },
                    //JSON response will show the newly created errand
                    json: function(){
                      res.json(errand);
                    }
                  });
                }
              })
      });



    /* GET New errand page. */
    router.get('/new', function(req, res) {
      res.render('errands/new', { title: 'Add New errand' });
    });

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Item').findById(id, function (err, errand) {
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
            //console.log(errand);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
          } 
        }).populate("owner").populate("assignee");
  });

router.route('/:id')
.get(function(req, res) {
  mongoose.model('Item').findById(req.id, function (err, errand) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      console.log('GET Retrieving ID: ' + req.id);
        //var errandtks = errandtks.toISOString();
        //errandtks = errandtks.substring(0, errandtks.indexOf('T'))
        res.format({
          json: function(){
            res.json(errand);
          },
          html: function(){
            res.render('errands/show', {
              "errand" : errand
            });
          }
        });
      }
    }).populate("owner").populate("assignee");
});

//GET the individual errand by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the errand within Mongo
    mongoose.model('Item').findById(req.id, function (err, errand) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
            //Return the errand
            console.log('GET Retrieving ID: ' + errand.id);
            //format the date properly for the value to show correctly in our edit form
          //var errandtks = errand.dob.toISOString();
          //errandtks = errandtks.substring(0, errandtks.indexOf('T'))
          res.format({
                 //JSON response will return the JSON output
                 json: function(){
                   res.json(errand);
                 },
                //HTML response will render the 'edit.pug' template
                html: function(){
                 res.render('errands/edit', {
                  title: 'errand' + errand.id,
                  "errand" : errand
                });
               }
             });
        }
      }).populate("owner").populate("assignee");
  });

//PUT to update a errand by ID
router.put('/:id', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var tmp_name = req.body.name;
    var tmp_description = req.body.description;
    var tmp_owner = req.body.owner;
    var tmp_assignee = req.body.assignee;
    var tmp_duedate = req.body.duedate;
    var tmp_completed = req.body.completed;

   //find the document by ID
   mongoose.model('Item').findById(req.id, function (err, errand) {
            //update it
            errand.update({
              name : tmp_name,
              description : tmp_description,
              owner : tmp_owner,
              assignee : tmp_assignee,
              duedate : tmp_duedate,
              completed : tmp_completed,
              updated : Date.now()
            }, function (err, errandID) {
              if (err) {
                res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                        html: function(){
                         res.redirect("/errands/" + errand.id);
                       },
                         //JSON responds showing the updated values
                         json: function(){
                           res.json(errand);
                         }
                       });
                    }
                  })
          }).populate("owner").populate("assignee");
 });

//DELETE a errand by ID
router.delete('/:id', function (req, res){
    //find errand by ID
    mongoose.model('Item').findById(req.id, function (err, errand) {
      if (err) {
        return console.error(err);
      } else {
            //remove it from Mongo
            errand.remove(function (err, errand) {
              if (err) {
                return console.error(err);
              } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + errand.id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                        html: function(){
                         res.redirect("/errands");
                       },
                         //JSON returns the item with the message that is has been deleted
                         json: function(){
                           res.json({message : 'deleted',
                             item : errand
                           });
                         }
                       });
                  }
                });
          }
        }).populate("owner").populate("assignee");
  });



module.exports = router;