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
        mongoose.model('Item').find({
          type: 'Task',
          $or:[ {'owner': req.user.id}, {'assignee': req.user.id} ] 
        }, function (err, tasks) {
          if (err) {
            return console.error(err);
          } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.pug file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
                      html: function(){
                        res.render('tasks/index', {
                          title: 'All my tasks',
                          "tasks" : tasks
                        });
                      },
                    //JSON response will show all tasks in JSON format
                    json: function(){
                      res.json(tasks);
                    }
                  });
                }     
              });
      })
    //POST a new task
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
         type : "Task",
         owner : tmp_owner,
         assignee : tmp_assignee,
         duedate : tmp_duedate,
         completed : tmp_completed,
       }, function (err, task) {
        if (err) {
          res.send("There was a problem adding the information to the database."+err);
        } else {
                  //task has been created
                  console.log('POST creating new task: ' + task);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                      html: function(){
                        // If it worked, set the header
                        res.location("tasks");
                        // And forward to success page
                        res.redirect("/tasks");
                      },
                    //JSON response will show the newly created task
                    json: function(){
                      res.json(task);
                    }
                  });
                }
              })
      });



    /* GET New task page. */
    router.get('/new', function(req, res) {
      res.render('tasks/new', { title: 'Add New task' });
    });

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Item').findById(id, function (err, task) {
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
        }).populate("owner").populate("assignee");
  });

router.route('/:id')
.get(function(req, res) {
  mongoose.model('Item').findById(req.id, function (err, task) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      console.log('GET Retrieving ID: ' + req.id);
        //var tasktks = tasktks.toISOString();
        //tasktks = tasktks.substring(0, tasktks.indexOf('T'))
        res.format({
          json: function(){
            res.json(task);
          },
          html: function(){
            res.render('tasks/show', {
              "task" : task
            });
          }
        });
      }
    }).populate("owner").populate("assignee");
});

//GET the individual task by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the task within Mongo
    mongoose.model('Item').findById(req.id, function (err, task) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
          var familiesIDs = [];
          for (i = 0; i < req.user.families.length; i++) { 
            familiesIDs.push(new mongoose.Types.ObjectId( req.user.families[i].family ));
          }
          mongoose.model('Family').find({
              '_id': { $in: familiesIDs}
          }, function(err, families){
            mongoose.model('User').find({
              'families.family': { $in: familiesIDs}
            }, function(err, assignees){
              res.format({
                     //JSON response
                     json: function(){
                       res.json(task);
                     },
                    //HTML response
                    html: function(){
                     res.render('tasks/edit', {
                      title: 'task' + task.id,
                      "task" : task,
                      "families": families,
                      "assignees": assignees
                    });
                   }
                 });
            })
          })
        }
      }).populate("owner").populate("assignee");
  });

//PUT to update a task by ID
router.put('/:id', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var tmp_name = req.body.name;
    var tmp_description = req.body.description;
    var tmp_assignee = req.body.assignee;
    if (tmp_assignee == -1) { // select none
      tmp_assignee = new mongoose.Types.ObjectId();
    }
    var tmp_duedate = req.body.duedate;
    var tmp_completed = req.body.completed;

   //find the document by ID
   mongoose.model('Item').findById(req.id, function (err, task) {
            //update it
            task.update({
              name : tmp_name,
              description : tmp_description,
              assignee: tmp_assignee,
              duedate: tmp_duedate,
              completed : tmp_completed,
              updated : Date.now()
            }, function (err, taskID) {
              if (err) {
                res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                        html: function(){
                         res.redirect("/tasks/" + task.id);
                       },
                         //JSON responds showing the updated values
                         json: function(){
                           res.json(task);
                         }
                       });
                    }
                  })
          }).populate("owner").populate("assignee");
 });

//PUT to resolve a task by ID
router.put('/:id/resolve', function(req, res) {

  //find and update document by ID
  var pointToReceive = 0;
  var relatedFamily = "";
  var relatedFamily_id = "";
  var oldpoints = 0;
  mongoose.model('Item').findById(req.id, function (err, task) {
    // Save point the user should receive
    pointToReceive = task.points.receive;
    relatedFamily = task.family;
    //update it
    task.update({
      completed: true,
      assignee: req.user._id,
      updated : Date.now()
    }, function (err, taskID) {
      if (err) {
        res.send("There was a problem updating the information to the database: " + err);
      } 
      else {
        // Add points to the user profile
        mongoose.model('User').findById(req.user._id, function (err, user) {
          if (err)
            res.send(err);

          var iFamCounter

          for (iFamCounter = 0; iFamCounter < user.families.length; iFamCounter++) {
            fam = user.families[iFamCounter];
            if(fam.family == relatedFamily.toString()) {
              oldpoints = fam.points;
              relatedFamily_id = fam._id;
              // Save points within User Model that is saved later on
              user.families[iFamCounter].points = oldpoints + pointToReceive;
            }
          }
          // Save updated user model
          user.save(function(err) {
            if (err)
                return res.send(err);
          });
      }).populate("owner").populate("assignee");
      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
      res.format({
        html: function(){
         res.redirect("/tasks/" + task.id);
       },
         //JSON responds showing the updated values
         json: function(){
           res.json(task);
         }
       });
    }
  })
  }).populate("owner").populate("assignee");
});


//PUT to reopen a task by ID
router.put('/:id/reopen', function(req, res) {

  var pointToReceive = 0;
  var relatedFamily = "";
  var relatedFamily_id = "";
  var oldpoints = 0;
  //find the document by ID
  mongoose.model('Item').findById(req.id, function (err, task) {

            // Remove point from user
            pointToReceive = task.points.receive;
            relatedFamily = task.family;
            //update it
            task.update({
              completed: false,
              updated : Date.now()
            }, function (err, taskID) {
              if (err) {
                res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                // Add points to the user profile
                mongoose.model('User').findById(req.user._id, function (err, user) {
                  if (err)
                    res.send(err);

                  var iFamCounter

                  for (iFamCounter = 0; iFamCounter < user.families.length; iFamCounter++) {
                    fam = user.families[iFamCounter];
                    if(fam.family == relatedFamily.toString()) {
                      oldpoints = fam.points;
                      console.log("oldpoints"+oldpoints)
                      relatedFamily_id = fam._id;
                      // Save points within User Model that is saved later on
                      user.families[iFamCounter].points = oldpoints - pointToReceive;
                    }
                  }
                  // Save updated user model
                  user.save(function(err) {
                    if (err)
                        return res.send(err);
                  });
                }).populate("owner").populate("assignee");
                //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                res.format({
                  html: function(){
                   res.redirect("/tasks/" + task.id);
                 },
                   //JSON responds showing the updated values
                   json: function(){
                     res.json(task);
                   }
                 }
                );
              }
            })
          }).populate("owner").populate("assignee");
 });

//DELETE a task by ID
router.delete('/:id', function (req, res){
    //find task by ID
    mongoose.model('Item').findById(req.id, function (err, task) {
      if (err) {
        return console.error(err);
      } else {
            //remove it from Mongo
            task.remove(function (err, task) {
              if (err) {
                return console.error(err);
              } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + task.id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                        html: function(){
                         res.redirect("/tasks");
                       },
                         //JSON returns the item with the message that is has been deleted
                         json: function(){
                           res.json({message : 'deleted',
                             item : task
                           });
                         }
                       });
                  }
                });
          }
        }).populate("owner").populate("assignee");
  });



module.exports = router;