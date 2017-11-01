// The author disclaims copyright to this code.
(function() {
	// throw a TypeError if not a function.  
	function assertType(fn, typename) {
		if ( !(typeof fn === typename) ) {
			throw new TypeError(fn + " is not a " + typename);
		}
	}
	
	// typedef Function(Any value, String key, Object obj) -> Any      as Callback
	// typedef Function(Any value, String key, Object obj) -> Boolean  as Predicate

	// shared logic between slice and splice
	function sxlice(obj, keys, destructive) {
		assertType(obj, "object");
		if ( !(keys instanceof Array ) ) {
			throw new TypeError("keys is not an array.");
		}

		var ret = {};
		var length = keys.length;
		for ( var i=0; i < length; i++ ) {
			var key = keys[i];
			if ( key in obj ) {
				ret[key] = obj[key];
				if ( destructive ) delete obj[key];
			}
		}
		return ret;
	}

	var algorithms = {
		// forEach( Object obj, Callback fn, Any scope? ) -> undefined
		forEach: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			for ( var key in obj ) {
				fn.call(scope, obj[key], key, obj);
			}
		},

		// keyOf(Object obj, Any value) -> String/undefined
		keyOf: function(obj, value) {
			assertType(obj, "object");

			for ( var key in obj) {
				if ( obj[key] === value ) return key;
			}
			// returns undefined if not found
		},

		// every(Object obj, Predicate fn, Any scope?) -> Boolean
		every: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			for ( var key in obj ) {
				if ( !fn.call(scope, obj[key], key, obj) ) {
					return false;
				}
				
			}
			return true;
		},

		// some(Object obj, Predicate fn, Any scope?) -> Boolean
		some: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			for ( var key in obj ) {
				if ( fn.call(scope, obj[key], key, obj) ) {
					return true;
				}
				
			}
			return false;
		},

		// filter(Object obj, Prediate fn, Any scope?) -> Object
		filter: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			var ret = {};
			for ( var key in obj ) {
				if ( fn.call(scope, obj[key], key, obj) ) {
					ret[key] = obj[key];
				}
			}
			return ret;
		},

		// reduce(Object obj, Function(prev, next, Number index, Object obj) fn, accumulator) -> Any
		reduce: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");

			// use the initial accumulator if provided. Otherwise we'll use the first
			// two elements in the array.
			var needFirst = true;
			var acc;
			if ( arguments.length > 2 ) {
				needFirst = false;
				acc = arguments[2];
			}

			// build up the accumulator.
			for ( var key in obj ) {
				if ( needFirst ) {
					acc = obj[key];
					needFirst = false;
				} else {
					acc = fn(acc, obj[key], key, obj);
				}
			}

			// it's an error if no init accumulator was passed in and the object was empty.
			if ( needFirst ) {
				throw new TypeError("Can't find an element to initialize the accumulator.");
			}

			return acc;
		},

		// map(Object obj, Callback fn, Any scope?) -> Object
		map: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			var ret = {};
			for ( var key in obj ) {
				ret[key] = fn.call(scope, obj[key], key, obj);
			}
			return ret;
		},

		// mapToArray(Object, Callback fn, Any scope?) -> Array
		//   similar to map, but the function return values are
		//   accumulated into an Array instead of an Object.
		mapToArray: function(obj, fn) {
			assertType(obj, "object");
			assertType(fn, "function");
			var scope = arguments[2];

			var ret = [];
			for ( var key in obj ) {
				ret.push( fn.call(scope, obj[key], key, obj) );
			}
			return ret;
		},

		// pop(Object obj, String key, Any default?) -> Any/undefined
		pop: function(obj, key) {
			assertType(obj, "object");
			if ( key in obj ) {
				var ret = obj[key];
				delete obj[key];
				return ret;
			} else {
				return arguments[2];
			}
		},

		// length(Object obj) -> UnsignedInteger
		length: function(obj) {
			assertType(obj, "object");

			var length = 0;
			for ( var key in obj ) length++;
			return length;
		},

		// empty(Object obj) -> Boolean
		empty: function(obj) {
			assertType(obj, "object");
			for ( var key in obj ) return false;
			return true;
		},

		// concat(Object x, Object y, ...) -> Object
		//   flattens any number of Object arguments into
		//   a single Object. If the same key appears more
		//   the once, the later argument takes precedence.
		//   undefined arguments are simply skipped.
		concat: function() {
			var ret = {};
			var len = arguments.length;
			for ( var i=0; i < len; i++ ) {
				var obj = arguments[i];
				if ( obj ) { 
					for ( var key in obj ) {
						ret[key] = obj[key];
					}
				}
			}
			return ret;
		},

		// slice(Object obj, Array keys) -> Object
		//   returns a new Object which is a subset of the original with
		//   only the specified keys.  If a key in the keys array is not
		//   in the object, it is not included in the returned Object.
		slice: function(obj, keys) { 
			return sxlice(obj, keys, false);
		},

		// splice(Object, obj, Array keys) -> Object
		//   Same as splice, but when an object is put into the new Object
		//   it is removed from the original object. This cleanly paritions
		//   the original set of keys: afterwards every original key is 
		//   either in the original object or the new Object but not both.
		splice: function(obj, keys) {
			return sxlice(obj, keys, true);
		},

		// keys(Object obj) -> Array
		//   key strings of the object as an array
		keys: function(obj) {
			return algorithms.mapToArray(obj, function(v,k) { return k;});
		},

		// values(Object obj) -> Array
		//   values in the object as a array
		values: function(obj) {
			return algorithms.mapToArray(obj, function(v) { return v;});
		},

		// pairs(Object obj) -> Array
		//  each item in the returned array is an Array of length 2: [key, value].
		pairs: function(obj) {
			return algorithms.mapToArray(obj, function(v,k) { return [k, v];});
		},

		// copy(Object obj) -> Object
		//   shallow copy of a single Object. Although this is a special case
		//   of concat(), copy() is still more semantic.
		copy: function (obj) {
			assertType(obj, "object");
			var ret = {};
			for ( var key in obj ) ret[key] = obj[key];
			return ret;
		}
	};

	// publish to the global namespace
	attache = window.attache || {};
	attache.object = algorithms;
})();

