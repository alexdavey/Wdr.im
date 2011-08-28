var track = new (function(){
    
    var trOpen = false;
    $('time-range').addEvent('change', function(e){
        console.log(this.value);
    });
    
    // Callback function for the Google Maps API
    this.mapsLoaded = function(){
	var myLatlng = new google.maps.LatLng(20, 0);
	var myOptions = {
	    zoom: 2,
	    center: myLatlng,
	    mapTypeId: google.maps.MapTypeId.HYBRID
	}
	this.map.map = new google.maps.Map($("map"), myOptions);
    }
    
    this.map = {};
    
    // Add a marker to the map
    this.map.addMarker = function(lat, lng){
	var latlng = new google.maps.LatLng(lat, lng);
	var marker = new google.maps.Marker({
	    position: latlng,
	    map: this.map,
	    zIndex: Math.round(latlng.lat()*-100000)<<5
        });
    }
    
    // Initiate the charts
    $('charts').getChildren().each(function(chart){
        chart.store('r', Raphael(chart.getElement('div'), 392, 212));
    });
    
    // Set chart data
    this.setChart = function(name, data){
	var r = $(name + '-chart').retrieve('r');
        r.clear();
	var pie = r.g.piechart(105, 105, 90, Object.values(data), {legend:Object.values(Object.map(data, function(val, key){return '%% - ' + key}))});
        pie.hover(function () {
            this.sector.stop();
            this.sector.scale(1.1, 1.1, this.cx, this.cy);
            if (this.label) {
                this.label[0].stop();
                this.label[0].scale(1.5);
                this.label[1].attr({"font-weight": 800});
            }
        }, function () {
            this.sector.animate({scale: [1, 1, this.cx, this.cy]}, 500, "bounce");
            if (this.label) {
                this.label[0].animate({scale: 1}, 500, "bounce");
                this.label[1].attr({"font-weight": 400});
            }
        });
    }
    
});

// Debugging & looks awesome :)
track.setChart('location', {
    'United States'     : 60,
    'United Kingdom'    : 20,
    'Netherlands'       : 10,
    'Candy Mountain'    : 10
});

track.setChart('referrer', {
    'yahoo.com'             : 40,
    'webdevrefinery.com'    : 45,
    'nodeknockout.com'      : 15
});

track.setChart('browser', {
    'Chrome'            : 40,
    'FireFox'           : 30,
    'Safari'            : 10,
    'Opera'             : 7,
    'Internet Explorer' : 13,
});

track.setChart('os', {
    'Mac OSX'   : 20,
    'Windows'   : 70,
    'Ubuntu'    : 10
});