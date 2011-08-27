
/**
 * Module dependencies.
 */

var express = require('express'),
	mongo = require('mongodb'),
	redis = require('redis'),
	nko   = require('nko')('VCPo4hn9tsswPvB7');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
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

// Renderable routes
app.get('/', function(req, res){
	res.render('index', {
		
	});
});

app.get(/\/([0-9]{6})\+/, function(req, res) {
	res.render('track', {

	});
});

// API routes
app.get(/\/([0-9]{6})/, function(req, res) {
	var id = req.params[0];
});

app.post(/\/data/, function(req, res) {
	
});

app.get(/\/([0-9]{6})\?/, function(req, res) {
	var id = req.params[0];
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
