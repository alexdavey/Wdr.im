(function() {
	
	function swapCharAt(string, position, character) { 
		var array = string.split('');
		array[position] = character;
		return array.join('');
	}

	function unique(charset, prev, length) {
		var old = prev || new Array(length).join(charset[0]);
		charset = charset.split('');
		charLength = charset.length;
		uniqueLength = old.length;
		return function () {
			// If last character is not the last in the charset
			while (uniqueLength--) {
				while (charLength--) {
					if (old[uniqueLength] !== charset[charLength]) {
						old = swapCharAt(old, uniqueLength, charset[charLength]);
						console.log(old, charLength, uniqueLength);
						return old;
					}
				}
			}
		}
	}

	window.counter = unique('abcdefghijklmnopqrstuvwxyz');
})();
