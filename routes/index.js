var express         = require('express');
var router          = express.Router();
var User            = require('../model/users')
var passport        = require('passport');  // provides user auth middelware
var bodyParser      = require('body-parser'); //parses information from POST
var methodOverride  = require('method-override'); //used to manipulate POST
var LocalStrategy   = require('passport-local').Strategy;

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', function(req, res, next) {
    User.register(new User({username : req.body.username, alias: req.body.alias}), req.body.password, function(err, user) {
        console.log(req.body.username);
        console.log(req.body.alias);
        console.log(req.body.password);
        if (err) {
          return res.render('register', { error : err.message });
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
});

router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
