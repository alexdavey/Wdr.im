// =============================================================================
// |                               Dependencies								   |
// =============================================================================

var express  = require('express'),
	socketIo = require('socket.io'),
	mongo = require('mongodb'),
	redis = require('redis'),
	nko   = require('nko')('VCPo4hn9tsswPvB7');


// =============================================================================
// |                                 Settings   							   |
// =============================================================================

"use strict";

var id = 1,
	charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-=";

// =============================================================================
// |                              Database wrapper							   |
// =============================================================================

function db(path, port, dbName) {
	this.dbName = dbName;
	this.mongo = new mongo.Server(path, port, { auto_reconnect : true });
	this.db = new mongo.Db(dbName, this.mongo);
	this.skeleton = {
		ip : [],
		os : [],
		time : [],
		clicks : [],
		browser : [],
		refferrer : []
	}
}

db.prototype.insertLink = function(urls) {
	if (!this.validateLink(urls)) throw err;
	var obj = merge(this.skeleton, urls);
	this.db.open(function(err, db) {
		if (err) throw err;
		db.collection('links', function(collection) {
			collection.insert(obj, { safe : true }, function(err) {
				throw err;
			});
		});
	});
};

db.prototype.pushLink = function(shortUrl, obj) {
	this.db.open(function(err, db) {
		db.collection('links', function(collection) {
			collection.update({ shortUrl : shortUrl },
				this.createLinkUpdateObj(obj));
		});
	});
};

db.prototype.createLinkUpdateObj = function(update) {
	var updateObj = {};
	this.update.forEach(function(value, key) {
		updateObj[key] = { $push : { key : value } };
	});
	return updateObj;
};

db.prototype.validateLink = function(link) {
	return 'shortUrl' in link && 'longUrl' in link;
};

db.prototype.validateClick = function(obj) {
	return ([].every.call(obj, function(value, key) {
		return key in this.skeleton;
	}));
};


// =============================================================================
// |                              Utility methods							   |
// =============================================================================

function merge(obj1, obj2) {
	var obj = clone(obj1);
	obj2.forEach(function(value, key) { obj[key] = value })
	return obj;
}

function clone(obj) {
	var result = {};
	obj.forEach(function(value, key) { new[key] = value });
	return result;
}

function unique(charset, number) {
    var base = charset.length, converted = '';
    do {
        converted = charset[number % base] + converted;
        number = Math.floor(number / base);
    } while (number > 0);
    return converted;
}

function getIp(req) {
	var ipAddress, forwardedIpsStr = req.header('x-forwarded-for'); 
	if (forwardedIpsStr) {
		var forwardedIps = forwardedIpsStr.split(',');
		ipAddress = forwardedIps[0];
	}
		if (!ipAddress) {
		ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
}

// =============================================================================
// |                                  Express  								   |
// =============================================================================

var app = module.exports = express.createServer();

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// =============================================================================
// |                                 Routes  								   |
// =============================================================================
app.get('/', function(req, res) {
	res.render('index', {
		view : 'index'
	});
});

app.get(/\/([\-\=\_0-9]{1,6})\+/, function(req, res) {
	res.render('track', {
		id : req.params[0],
		longUrl : 'google.com',
		view : 'tracking',
		clicks : 1234
	});
});

// API routes
app.get(/\/([\-\=\_0-9]{1,6})/, function(req, res) {
	var id = req.params[0];
});

app.post(/\/data/, function(req, res) {
	if (!req.body.url) res.send('Error, Error!');
	var shortUrl = unique(charset, id++);
	res.redirect('/' + shortUrl + '+');
	db.setId(shortUrl, {
		longUrl : req.body.url,
		startTime : new Date()
	});
});


// =============================================================================
// |                                 Start  								   |
// =============================================================================
app.listen(3000);
console.log("Express server listening on port %d in %s mode", 
	app.address().port, app.settings.env);
