// =============================================================================
// |                               Dependencies								   |
// =============================================================================

var socketIO = require('socket.io'),
	express  = require('express'),
	request  = require('request'),
	mongo = require('mongodb'),
	redis = require('redis'),
	_ = require('underscore');


// =============================================================================
// |                                 Settings   							   |
// =============================================================================

"use strict";

var charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-=";

var app = module.exports = express.createServer();
var io = socketIO.listen(app);

// =============================================================================
// |                              Database wrapper							   |
// =============================================================================

function DB(path, port, dbName, callback) {
	var that = this;
	this.dbName = dbName;
	this.server = new mongo.Server(path, port, { auto_reconnect : true, poolSize : 10 });
	this.skeleton = {
		ip : [],
		/* os : [], */
		time : []
		/* browser : [], */
		/* refferrer : [] */
	};
	var DB = new mongo.Db(dbName, this.server);
	DB.open(function(err, db) {
		if (err) throw err;
		that.db = db;
		that.collection('links', function(collection) { 
			this.links = collection;
			callback();
		});
	});
}

DB.prototype.insertLink = function(urls) {
	if (!this.validateLink(urls)) throw err;
	var obj = _.extend(urls, this.skeleton);
	this.collection('links', function(collection) {
		collection.insert(obj, { safe : true }, handleError);
	});
	this.collection('stats', function(collection) {
		collection.update({}, { $inc : { maxId : 1 } });
	});
};

DB.prototype.pushLink = function(shortUrl, obj) {
	this.collection('links', function(collection) {
		var patch = this.createLinkUpdateObj(obj);
		collection.update({ shortUrl : shortUrl }, patch);
	});
};

DB.prototype.collection = function(name, fn) {
	var that = this;
	this.db.createCollection(name, function(err, collection) {
		if (err) throw err;
		fn.call(that, collection, db);
	});
};

DB.prototype.createLinkUpdateObj = function(update) {
	return {
		$inc : { clicks : 1 },
		$push : {
			ip : update.ip,
			time : new Date()
		}
	};
};

DB.prototype.stats = function(callback) {
	this.collection('stats', function(err, collection) {
		if (err) throw err
		collection.findOne({}, function(err, item) {
			if (err) throw err;
			callback(item);
		});
	});
}

DB.prototype.getLongUrl = function(shortUrl, callback) {
	this.findLink(shortUrl, function(item) {
		if (!item) return '/404';
		callback(item.longUrl);
	});
};

DB.prototype.validateLink = function(link) {
	return 'shortUrl' in link && 'longUrl' in link && 'date' in link;
};

DB.prototype.validateClick = function(obj) {
	return _.every(obj, function(value, key) {
		return key in this.skeleton;
	});
};

DB.prototype.findLink = function(id, callback) {
	this.collection('links', function(collection) {
		collection.findOne({ shortUrl : id }, function(err, item) {
			if (err) throw err;
			callback(item);
		});
	});
};

DB.prototype.aggregate = function(id, callback) {
	this.findLink(id, function(item) {
		console.dir(item);
		callback(item);
	});
};

DB.prototype.streamId = function(shortUrl, data, end) {
	this.collection('links', function(collection) {
		var stream = collection.find({ shortUrl : shortUrl }).streamRecords();
		stream.on('data', data);
		stream.on('end', end);
	});
};

// =============================================================================
// |                            Socket.io wrapper							   |
// =============================================================================

	var inRoom = {};
	
	io.sockets.on('connection', function(socket) {
		socket.on('id', function() {
			if (validateId(id)) {
				socket.join(id);
			}
	
		})
	});

// function Socket(app) {
// 	var that = this;
// 	this.clients = {};
// 	this.io = socketIO.listen(app);
// 	this.io.sockets.on('connection', function(socket) {
// 		socket.on('id', function(data) {
// 			db.aggregate(data, function(item) {
// 				console.dir(item);
// 				socket.emit('message', JSON.stringify(item));
// 				console.log('sent Data');
// 			});
// 			that.addClient(data, socket);
// 		});
// 	});
// }
// 
// Socket.prototype.push = function(id, data) {
// 	if (id in this.clients)
// 		this.clients[id].emit('update', JSON.stringify(data));
// };
// 
// Socket.prototype.addClient = function(id, socket) {
// 	if (id in this.clients) {
// 		this.clients[id].push(socket);
// 	} else {
// 		this.clients[id] = [socket];
// 	}
// };
// 
// Socket.prototype.removeClient = function(id) {
// 	if (id in this.clients) delete this.clients[id];
// };
// 
// Socket.prototype.clientConnected = function(id) {
// 	return id in this.clients;
// };

// =============================================================================
// |                              Utility methods							   |
// =============================================================================

function handleError(err) {
	if (err) throw err;
}

function validateId(id) {
	var len = id.length;
	return typeof id == 'string' && len < 6 &&
			/[\-\=\_a-z0-9]/i.exec(id).length == len;
}

function parseData(req) {
	var ua = parseUA(req);
	return {
		browser : ua.browser,
		ip : getIp(req),
		time : new Date(),
		os : ua.os
	};
}

function parseUrl(req) {
	if (!req.body.url) throw 'Invalid URL';
	var url = req.body.url;
	if (url.indexOf('http://') !== -1) url = url.substring(7);
	return url;
}

function parseUA(req) {
	var s = req.headers['user-agent'].toLowerCase();
	var match = /(webkit)[ \/]([\w.]+)/.exec(s) ||
		/(opera)(?:.*version)?[ \/]([\w.]+)/.exec(s) ||
		/(msie) ([\w.]+)/.exec(s) ||
		!/compatible/.test(s) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(s) || [];
	var os = /(mac)/.exec(s) || /(win)/.exec(s) || 
			 /(iphone)/.exec(s) || /(linux)/.exec(s) || [];
	return { 
		os : match[0] || 'Other',
		browser : match[1] || 'Other'
	};
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

app.get(/\/([\=\-\_0-9]{1,6})\+/i, function(req, res) {
	res.render('track', {
		id : req.params[0],
		longUrl : 'http://google.com',
		view : 'tracking',
		clicks : '000000001234'
	});
});

// API routes
app.get(/\/([\=\-\_0-9]{1,6})/i, function(req, res) {
	var id = req.params[0],
		data = parseData(req);
	db.getLongUrl(id, function(url) { res.redirect(url) });
	db.pushLink(id, data);
	if (inRoom(id)) socket.send(JSON.stringify(data))
	// if (io.clientConnected(id)) {
	// 	io.push(id, data);
	// }
});

app.post(/\/data/, function(req, res) {
	var longUrl = parseUrl(req),
		shortUrl = unique(charset, id++);
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

var id;
var db = new DB('localhost', 27017, 'testing', function() {
	db.stats(function(stats) {
		/////////
	});
	db.collection('stats', function(collection) {
		collection.findOne({}, function(err, item) {
			if (err)  { console.log('We have an error! An error!'); } 
			if (item && item.maxId) {
				id = (item && item.maxId) || 1;
			} else {
				collection.insert({ maxId : 1 });
			}
		});
	});
	app.listen(3000);
	console.log("Express server listening on port %d in %s mode", 
		app.address().port, app.settings.env);
});
