var wdr = new (function(){
    this.ready = function(){
	// Animate the colored strip
	var stripi = 0;
	var animateStrip = function(){
	    strip.tween('background-position', (++stripi * 1000) + 'px 0px');
	};
	var strip = $('color-strip').setStyle('background-position', '0px 0px')
				    .set('tween', {
	    duration: 	10000,
	    transition: Fx.Transitions.linear,
	    link: 	'cancel',
	    onComplete:	animateStrip
	});
	animateStrip();
	
	$('shorten-url').addEvent('submit', function(e){	    
	    var url = this.getElement('input'),
		regexp = /^(http(?:s)?\:\/\/[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6}(?:\/?|(?:\/[\w\-]+)*)(?:\/?|\/\w+\.[a-zA-Z]{2,4}(?:\?[\w]+\=[\w\-]+)?)?(?:\&[\w]+\=[\w\-]+)*)$/;
	    if (!regexp.test(url.value)){
		url.value = 'http://' + url.value;
		if (!regexp.test(url.value)){
		    e.preventDefault();
		    wdr.flash('FF0000', 2000);
		}
	    }
	})
    }
    
    this.flash = function(color, time){
	var el = $('color-flash').setStyle('background-color', color).fade(1);
	setTimeout(function(){
	    el.fade(0);
	}, time);
    };
    
    // Onload
    window.addEvent('domready', this.ready);
});