var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect('mongodb://admin2:34567@ec2-35-166-3-103.us-west-2.compute.amazonaws.com:27017/dreamemo');
var passport = require('passport');
var jwt = require('express-jwt');

require('../models/Entries');
require('../models/Users');
require('../models/Quotes');

var Promise = require("bluebird");
var join = Promise.join;

var Entry = mongoose.model('Entry');
var User = mongoose.model('User');
var Quote = mongoose.model('Quote');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* REGISTER */
router.post('/register', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	var user = new User();

	user.username = req.body.username;
	user.email = req.body.email;
	user.name = req.body.name;
	
	user.setPassword(req.body.password);

	user.save(function (err){
		if(err){
			console.log(err);
			return next(err);
		}

		return res.json({token: user.generateJWT()})
	});
});

/* USER */

router.get('/users/:username', function(req, res, next){
	req.user.populate('entries', function(err, user) {
		if (err) { return next(err); }
		else {
			req.user.entries = user.entries;
			return res.json({user: req.user});
		}
	});
});

router.param('username', function(req, res, next, usrnam) {
	if(!usrnam){
		return res.status(400).json({message: 'Please provide a valid username!'});
	}
	var query = User.findOne({username: usrnam});
	
	query.exec(function (err, user){
		if (err) { return next(err); }
		if (!user) { return next(new Error('can\'t find user')); }

		req.user = user;
		return next();
	});
});

/* EDIT PROFILE */
router.post('/check', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err, user, info){
		if(err){ return next(err); }

		return res.json(user);
	})(req, res, next);
});

router.post('/users/:username/edit', auth, function(req, res, next) {
//	var user = new User();
//
//	user.name = req.body.name;
//	if(req.body.password != "") user.setPassword(req.body.password);

	User.findByIdAndUpdate(req.body._id, req.body, {'upsert': 'true', 'new' : 'true'}, function(err, user) {
		if (err) return next(err);
		if(req.body.password != "") req.user.setPassword(req.body.password);
		req.user.save(function (err){
			if(err) return next(err);
			return res.json(user);
		});
	})
});


/* LOGIN */
router.post('/login', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err, user, info){
		if(err){ return next(err); }

		if(user){
			return res.json({token: user.generateJWT()});
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
});

/* ENTRIES */
router.get('/users/:username/entries', function(req, res, next) {
	var todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);
	todayDate = todayDate.toISOString();
	//console.log(todayDate);
	
	var tmrwDate = new Date();
	tmrwDate.setDate(tmrwDate.getDate() + 1);
	tmrwDate.setHours(0, 0, 0, 0);
	tmrwDate = tmrwDate.toISOString();
	//console.log(tmrwDate);
	
	Entry.findOne({author: req.user.username, createdAt: { $gte : todayDate, $lte : tmrwDate }}, function(err, entry) {
		if(err) { return next(err); }
		else {
			res.json(entry);
		}
	});
	
});

router.post('/users/:username/entries', auth, function(req, res, next) {
	if(req.body._id === undefined) {
		var entry = new Entry(req.body);
		entry.author = req.payload.username;

		entry.save(function(err, entry){
			if(err){ return next(err); }

			req.user.entries.push(entry);
			req.user.save(function(err, user){
				if(err){ return next(err); }

				res.json(entry);
			});
		});
	} else {
		Entry.findByIdAndUpdate(req.body._id, req.body, {'upsert' : 'true', 'new' : 'true'}, function(err, entry) {
			if (err) {
				return next(err);
			} else {
				res.json(entry);
			}
		});
	}
});

/* QUOTES */
router.get('/quotes', function(req, res, next) {
	var today = req.query;
	
	Quote.findOne({month: today.month, day: today.day, year: (today.year-100+2000)}, function(err, quote) {
		if(err) { return next(err); }
		else {
			res.json(quote);
		}
	});
	
});

router.get('/quotes/year', function(req, res, next) {
	var today = req.query;
	
	Quote.find({year: today}, function(err, quotes) {
		if(err) { return next(err); }
		else {
			res.json(quotes);
		}
	});
	
});

module.exports = router;
