(function() {

var mongo = require('mongodb');

function MC(path, port, dbName) {
	this.mongo = new mongo.Server(path, port, { auto_reconnect : true });
	this.db = new mongo.Db(dbName, this.mongo);
}

MC.open : function(fn) {
	this.db.open(function(err, db) {
		if (err) throw err;
		db.collection(function(err, collection) {
			if (err) throw err;
			fn.call(this, collection);
		});
	});
},

MC.getId : function(id) {
	this.open(function(collection) {
		collection.find({ id : id });
	});
},

MC.insert : function() {
	var docs = [].slice.call(arguments);
	docs.forEach(function(doc) {
		
	});
},

MC.update : function() {
	
},

MC.remove : function() {
	
}

// Export to CommonJS
exports.mongo-cache = MC;

})();
