(function() {
	// deep compare of javascript native objects.  Objects
	// and Arrays are compared item by item.
	function same(x, y) {
		// NaN is special because its not equal or identical to itself (but NaN is 
		// the same as NaN!) We check it here first because it's so weird... NaN has
		// a constructor (Number) but its type is 'number' that doesn't fit into the below
		// logic.  Also, isNaN() is true for some non-numbers, so we have to check that too.
		if ( typeof x === 'number' && isNaN(x) && typeof y === 'number' && isNaN(y) ) return true;

		// compare non-objects directly.
		if ( typeof x !== 'object' ) return x === y;

		try { 
			var xc = x.constructor;
			var yc = y.constructor;
		} catch( e ) { 
			if ( e instanceof TypeError ) {
				// x or y didn't allow property access, so is another kind of non-object, like null,
				// which we'll compare by identity.
				return x === y;
			}
			else throw e;
		}

		// objects of different classes can't be the same.
		if ( xc !== yc ) return false;

		if ( x === y ) {
			return true;
		} else {
			// use the registered predicate if known.
			var predicate = same.findPredicate(x);
			if ( predicate ) return predicate(x, y);
		}
		return false;
	}
	same.predicates = [];

	// register a sameness predicate for a class.
	same.register = function(_class, predicate) {
		same.predicates.unshift({_class: _class, predicate: predicate});
	}
	// find the best predicate to handle comparisons on the given type.
	same.findPredicate = function(x) {
		var ps = same.predicates;
		for ( var i=0; i < ps.length; i++ ) {
			if ( x instanceof ps[i]._class ) return ps[i].predicate;
		}
	}

	// how to compare two Objects for sameness.
	same.register(Object, function(x, y) {
		for ( var key in x ) {
			// y must have every key that x does.
			if ( !(key in y) ) return false;

			// x and y must have the same values for every key.
			if ( !same(x[key], y[key]) ) return false;
		}

		for ( var key in y ) {
			// x must have every key that y does.
			if ( !(key in x) ) return false;
			
			// we already know the values of shared keys are the same,
			// so there's no need to do an additional check.
		}
		return true;
	});

	// how to compare two Arrays for sameness.
	same.register(Array, function(x, y) {
		var length = x.length;
		// arrays of different lengths are obviously not the same.
		if ( y.length !== length ) return false;

		for ( var i = 0; i < length; i++ ) {
			if ( !same(x[i], y[i]) ) return false;
		}
		return true;
	});

	same.register(Date, function(x, y) {
		return x.valueOf() === y.valueOf();
	});

	// install into attache namespace
	window.attache = window.attache || {};
	window.attache.same = same;
})();
