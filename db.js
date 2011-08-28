// =============================================================================
// |                              Database wrapper							   |
// =============================================================================

function DB(path, port, dbName) {
	var that = this;
	this.dbName = dbName;
	this.server = new mongo.Server(path, port, { auto_reconnect : true });
	this.skeleton = {
		ip : [],
		os : [],
		time : [],
		clicks : [],
		browser : [],
		refferrer : []
	};
	var DB = new mongo.Db(dbName, this.server);
	DB.open(function(err, db) {
		if (err) throw err;
		that.db = db;
		init();
	});
}

DB.prototype.insertLink = function(urls) {
	if (!this.validateLink(urls)) throw err;
	var obj = _.extend(urls, this.skeleton);
	this.collection('links', function(collection) {
		collection.insert(obj, { safe : true }, handleError);
	});
};

DB.prototype.pushLink = function(shortUrl, obj) {
	this.collection('links', function(collection) {
		collection.update({ shortUrl : shortUrl }, this.createLinkUpdateObj(obj));
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
	return _.every(obj, function(value, key) {
		return key in this.skeleton;
	});
};

exports = db;
