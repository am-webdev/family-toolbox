var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST


router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))


//build the REST operations at the base for tasks
//this will be accessible from http://127.0.0.1:3000/tasks if the default route for / is left unchanged
router.route('/')
    //GET all tasks
    .get(function(req, res, next) {
        //retrieve all tasks from Monogo
        mongoose.model('Task').find({}, function (err, tasks) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/tasks folder. We are also setting "tasks" to be an accessible variable in our jade view
                    html: function(){
                        res.render('tasks/index', {
                              title: 'All my tasks',
                              "tasks" : tasks
                          });
                    },
                    //JSON response will show all tasks in JSON format
                    json: function(){
                        res.json(infophotos);
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
		var tmp_owner = req.body.owner;
		var tmp_assignee = req.body.assignee;
		var tmp_duedate = req.body.duedate;
		var tmp_completed = req.body.completed;

        //call the create function for our database
        mongoose.model('Task').create({
	  		name : tmp_name,
			description : tmp_description,
			owner : tmp_owner,
			assignee : tmp_assignee,
			duedate : tmp_duedate,
			completed : tmp_completed,
        }, function (err, task) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
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
    mongoose.model('Task').findById(id, function (err, task) {
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

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Task').findById(req.id, function (err, task) {
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
    });
  });

//GET the individual task by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the task within Mongo
    mongoose.model('Task').findById(req.id, function (err, task) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the task
            console.log('GET Retrieving ID: ' + task.id);
            //format the date properly for the value to show correctly in our edit form
          //var tasktks = task.dob.toISOString();
          //tasktks = tasktks.substring(0, tasktks.indexOf('T'))
            res.format({
                 //JSON response will return the JSON output
                json: function(){
                       res.json(task);
                 },
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('tasks/edit', {
                          title: 'task' + task.id,
                          "task" : task
                      });
                 }
            });
        }
    });
});

//PUT to update a task by ID
router.put('/:id', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
	var tmp_name = req.body.name;
	var tmp_description = req.body.description;
	var tmp_owner = req.body.owner;
	var tmp_assignee = req.body.assignee;
	var tmp_duedate = req.body.duedate;
	var tmp_completed = req.body.completed;

   //find the document by ID
        mongoose.model('Task').findById(req.id, function (err, task) {
            //update it
            task.update({
		  		name : tmp_name,
				description : tmp_description,
				owner : tmp_owner,
				assignee : tmp_assignee,
				duedate : tmp_duedate,
				completed : tmp_completed,
				updated : Date.now
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
        });
});

//DELETE a task by ID
router.delete('/:id', function (req, res){
    //find task by ID
    mongoose.model('Task').findById(req.id, function (err, task) {
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
    });
});



module.exports = router;