(function() {
	
	var sio = require('socket.io'),
		request = require('request'),
		db = require('db');
	
	var io = sio.listen(???????);

	socket.on('connection', function(socket) {
		api.forEach(function(value, key) {
			socket.on(key, function(data) {
				value(socket, JSON.parse(data));
			});
		});
	});

	var api = {

		ip : function(socket, data) {
				
		},

		browser : function(socket, data) {
			
		},

		time : function(socket, data) {
			
		},

		source : function() {
			
		}

	};

});
