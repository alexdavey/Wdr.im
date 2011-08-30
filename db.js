// =============================================================================
// |                              Database wrapper							   |
// =============================================================================

var mongo = require('mongodb'),
	_ = require('underscore'),
	async = require('async');

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
		db.createCollection('links', function(err, coll) { 
			if (err) throw err;
			that.links = coll;
		});
		db.createCollection('stats', function(err, coll) {
			if (err) throw err;
			that.stats = coll;
			callback();
		});
	});
}

DB.prototype.insertLink = function(urls) {
	if (!this.validateLink(urls)) throw err;
	var obj = _.extend(urls, this.skeleton);
	this.links.insert(obj, { safe : true }, handleError);
	this.stats.update({}, { $inc : { maxId : 1 } });
};

DB.prototype.pushLink = function(shortUrl, obj) {
	var patch = this.createLinkUpdateObj(obj);
	this.links.update({ shortUrl : shortUrl }, patch);
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

DB.prototype.getStats = function(callback) {
	this.stats.findOne({}, function(err, item) {
		if (err) throw err;
		callback(item);
	});
};

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
	this.links.findOne({ shortUrl : id }, function(err, item) {
		if (err) throw err;
		callback(item);
	});
};

DB.prototype.aggregate = function(id, callback) {
	this.findLink(id, function(item) {
		// More to come here...
		callback(item);
	});
};

DB.prototype.streamId = function(shortUrl, data, end) {
	var stream = this.links.find({ shortUrl : shortUrl }).streamRecords();
	stream.on('data', data);
	stream.on('end', end);
};

module.exports = DB;
