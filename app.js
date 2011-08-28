// =============================================================================
// |                               Dependencies								   |
// =============================================================================

var socketIo = require('socket.io'),
	express  = require('express'),
	mongo = require('mongodb'),
	redis = require('redis'),
	nko   = require('nko')('VCPo4hn9tsswPvB7'),
	_ = require('underscore');


// =============================================================================
// |                                 Settings   							   |
// =============================================================================

"use strict";

var id = 1,
	charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-=";

// =============================================================================
// |                              Database wrapper							   |
// =============================================================================

function DB(path, port, dbName) {
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
	};
}

DB.prototype.insertLink = function(urls) {
	if (!this.validateLink(urls)) throw err;
	var obj = _.extend(urls, this.skeleton);
	this.collection('links', function(collection) {
		collection.insert(obj, { safe : true }, handleError);
	});
};

DB.prototype.pushLink = function(shortUrl, obj) {
	this.colection('links', function(collection) {
		collection.update({ shortUrl : shortUrl }, this.createLinkUpdateObj(obj));
	});
};

DB.prototype.collection = function(name, fn) {
	var that = this;
	this.db.open(function(err, db) {
		if (err) throw err;
		db.collection(name, function(err, collection) {
			if (err) throw err;
			fn.call(that, collection, db);
		});
	});
};

DB.prototype.createLinkUpdateObj = function(update) {
	var updateObj = {};
	_.each(this.update, function(value, key) {
		updateObj[key] = { $push : { key : value } };
	});
	return updateObj;
};

DB.prototype.validateLink = function(link) {
	return 'shortUrl' in link && 'longUrl' in link && 'date' in link;
};

DB.prototype.validateClick = function(obj) {
	return [].every.call(obj, function(value, key) {
		return key in this.skeleton;
	});
};

// =============================================================================
// |                              Utility methods							   |
// =============================================================================

function handleError(err) {
	throw err;
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

var app = module.exports = express.createServer(),
	db = new DB('localhost', 27017, 'wdr');

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
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
		longUrl : 'http://google.com',
		view : 'tracking',
		clicks : '000000001234'
	});
});

// API routes
app.get(/\/([\-\=\_0-9]{1,6})/, function(req, res) {
	var id = req.params[0];
});

app.post(/\/data/, function(req, res) {
	if (!req.body.url) throw 'Error, Error!';
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' + req.body.url);
	var shortUrl = unique(charset, id++);
	res.redirect('/' + shortUrl + '+');
	db.insertLink({
		longUrl : req.body.url,
		shortUrl : shortUrl,
		date : new Date()
	});
});


// =============================================================================
// |                                 Start  								   |
// =============================================================================
app.listen(3000);
console.log("Express server listening on port %d in %s mode", 
	app.address().port, app.settings.env);
