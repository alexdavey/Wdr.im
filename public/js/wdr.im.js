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