// =============================================================================
// |                               Dependencies								   |
// =============================================================================

var express  = require('express'),
	socketIo = require('socket.io'),
	mongo = require('mongodb'),
	redis = require('redis'),
	nko   = require('nko')('VCPo4hn9tsswPvB7');


// =============================================================================
// |                              The app itself							   |
// =============================================================================

var id = 1,
    charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-=";

var db = {
    setId : function() {return}
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

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
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
app.get('/', function(req, res){
    res.render('index', {view:'index'});
});

app.get(/\/([0-9a-z\_\-\=]{1, 6})\+/i, function(req, res) {
	res.render('track', {
		id : req.params[0]
	});

app.get(/\/([0-9a-z\_\-\=]{1,6})\+/i, function(req, res) {
    res.render('track', {
        id      : req.params[0],
        longUrl : 'http://example.com',
        clicks  : 7071,
        
        view    : 'tracking'
    });
});

// API routes
app.get(/\/([0-9a-z\_\-\=]{1,6})/i, function(req, res) {
    var id = req.params[0];
});

app.post(/\/data/, function(req, res) {
    if (!req.body.url)
        res.send('Error, Error!');
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
