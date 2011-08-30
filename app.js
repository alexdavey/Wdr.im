// =============================================================================
// |                               Dependencies								   |
// =============================================================================

var socketIO = require('socket.io'),
	express  = require('express'),
	request  = require('request'),
	DB = require('./db'),
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
// |                            Socket.io wrapper							   |
// =============================================================================

	io.sockets.on('connection', function(socket) {
		socket.on('id', function(id) {
			console.log(io.sockets.clients);
			if (validateId(id)) socket.join(id);
		});
	});

	function inRoom(id) {
		
	}

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
	db.getStats(function(stats) {
		if (stats && stats.maxId) {
			id = stats.maxId;
		} else {
			stats.insert({ maxId : 1 });
		}
	});
	app.listen(process.env.NODE_ENV == 'production' ? 80 : 3000);
	console.log("Express server listening on port %d in %s mode", 
		app.address().port, app.settings.env);
});
