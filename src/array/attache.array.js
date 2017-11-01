// The author disclaims copyright to this code.
(function() {
	"use strict";

	// Short Synonyms
	// Throughout this library:
	//     ln means the length of an array.
	//     s means a start index.
	//     a is the array-like object the algorithm is applied to.
	//     ret means returnValue.
	//     fn is the main functional argument to the algorithm.
	// It may not seem like much, but using these shorter names reduces the
	// size of the minified library by about 15%.

	// Function ui32(Any n) -> Number
	// Emulates the internal ToUint32 algorithm in the standard. Convert any
	// object to a non-negative integer.  Negative lengths are a sticking
	// point.  The  standard implies that you should execute 2^31 operations if
	// you get a negative length, but that seems like a mistake to me.  Most
	// browsers don't if you pass in a negative length, although some
	// "correctly" hang for at least some of the algorithms.  Regardless, the
	// only reasonable thing to do with a negative length is to return
	// immediately.
	function ui32(n) {
		n = isFinite(n) ? Math.floor(n) : 0;
		return n >= 0 ? n : 0;
	}

	// throw a TypeError if not a function.  The standard specifies "callable"
	// rather than functions, and some non-function objects are callable but
	// are not functions, like RegExp in some browsers. However some still
	// expect "real" functions: in Chrome, [].every(/x/) throws "TypeError: /x/
	// is not a function", even though RegExps are callable in Chrome.
	// Further, we can't check explicitly for callableness without actually
	// calling it but can we check for functions with typeof. Since we do want
	// to throw the error even if the array is empty and would prefer to throw
	// a meaningful error message rather than letting it crash later when the
	// function invokation fails, we check for functions rather than the more
	// abstract concept of "Callable."
	// 
	// TL;DR In practice "is callable" means "is a function".
	function canCall(fn) {
		if ( typeof fn !== 'function' ) {
			throw new TypeError(fn + " is not a function");
		}
	}

	// common algorithm for reduce() and reduceRight().
	function reduce(args, reverse) { 
		var fn = args[0], // reducer function
			acc, // the accumulator
			i = 0, // index
			a = Object(this),
			ln = ui32(a.length),
			more, // internal function to test if loop complete
			next; // internal function to advance to the next item

		// validate arguments
		if ( this == null ) throw new TypeError("missing this argument");
		canCall(fn);
		if ( ln === 0 && args.length < 2 ) throw new TypeError("can't reduce empty array without accumulator");

		if ( reverse ) {
			more = function() { return i >= 0 };
			next = function() { return i-- };
			i = ln-1;
		} else {
			more = function() { return i < ln };
			next = function() { return i++ };
		}

		// use the accumulator if explicitly passed in...
		if ( args.length >= 2 ) { 
			acc = args[1];
		} else {
			// or seek forward to find the first value to initialize the accumulator.
			var found = false;
			while ( !found && more() ) {
				found = (i in a); 
				if ( found ) acc = a[i];
				next();
			}
			if ( !found ) throw new TypeError("can't find an element to initialize accumulator");
		}

		// combine the accumulator with each forward item.
		while ( more() ) {
			if ( i in a ) {
				acc = fn.call(undefined, acc, a[i], i, a);
			}
			next();
		}

		return acc;
	}

	// algorithms defined in the standard but not available in all environments, namely IE.
	var std = {
	
		// indexOf(Any value, Number start?) -> Number
		indexOf: function(value) {
			var a = Object(this),
				ln = ui32(a.length),
				s = parseInt(arguments[1]) || 0,
				i; // index
			if ( ln === 0 ) return -1;

			// normalize the start index
			if ( s > ln ) return -1;
			if ( s < 0 ) {
				s = ln + s;
				if ( s < 0 ) s = 0;
			}

			// search for the element
			for ( i=s; i<ln; i++) {
				if ( i in a ) {
					if ( value === a[i] ) return i;
				}
			}
			return -1;
		},

		// lastIndexOf(Any value, Number start?) -> Number
		lastIndexOf: function(value) {
			var a = Object(this),
				ln = ui32(a.length),
				s = parseInt(arguments[1]),
				i; // index
			if ( ln === 0 ) return -1;

			// normalize the start index
			// note: while superficially similar to indexOf(), the starting
			// index logic for lastIndexOf() is completely different...
			if ( s !==0 && !s ) s = ln; // hmmm...
			if ( s >= 0 ) {
				if ( s >= ln ) ln-1;
			} else {
				s = ln + s;
			}

			// search for the element
			for ( i=s; i>=0; i--) {
				if ( i in a ) {
					if ( value === a[i] ) return i;
				}
			}
			return -1;
		},

		// every( Function predicate(Any value, Number index, Array array) -> Boolean, Any scope? ) -> Boolean
		every: function(fn) {
			var a = Object(this),
				ln = ui32(a.length),
				scope = arguments[1],
				i; // index
			for ( i=0; i<ln; i++) {
				if ( i in a ) {
					if ( !fn.call(scope, a[i], i, a) ) return false;
				}
			}
			return true;
		},

		// some( Function predicate(Any value, Number index, Array array) -> Boolean, Any scope? ) -> Boolean
		some: function(fn) {
			canCall(fn);
			return !std.every.call(this, function() { 
				return !fn.apply(this, arguments);
			}, arguments[1]);
		},

		// forEach( Function handler(Any value, Number index, Array array), Any scope? ) -> undefined
		forEach: function(fn) {
			canCall(fn);
			var a = Object(this),
				ln = ui32(a.length),
				scope = arguments[1],
				i; // inex
			for ( i=0; i <ln; i++ ) {
				if ( i in a ) {
					fn.call(scope, a[i], i, a);
				}
			}
		},

		// filter( Function predicate(Any value, Number index, Array array) -> Boolean, Any scope? ) -> Array
		filter: function(fn) {
			canCall(fn);
			var ret = [];
			std.forEach.call(this, function(value) {
				if ( fn.apply(this, arguments) ) ret.push(value);
			}, arguments[1]);
			return ret;
		},

		// map( Function mapper(Any value, Number index, Array array) -> Any, Any scope? ) -> Array
		map: function(fn) {
			canCall(fn);
			var ret = [];
			std.forEach.call(this, function(value) {
				ret.push( fn.apply(this, arguments) );
			}, arguments[1]);
			return ret;
		},

		// reduce(Function reducer(Any previous, Any current, Number index, Array array) -> Any, Any accumulator?) -> Any
		reduce: function(fn) { 
			return reduce.call(this, arguments, false);
		},

		// reduceRight(Function reducer(Any previous, Any current, Number index, Array array) -> Any, Any accumulator?) -> Any
		reduceRight: function(fn) {
			return reduce.call(this, arguments, true);
		}
	};

	// install missing methods onto Array.prototype 
	var ap = Array.prototype;
	for ( var key in std ) if ( !(key in ap) ) ap[key] = std[key];

	// Function ns(Object base, String name) -> Object
	//   makes sure that the key name exists in the base
	// object, creates it if it does not, and returns it.
	function ns(b, n) {
		return n in b ? b[n] : b[n] = {};
	}

	// expose the standard algorithms in a public namespace, in case they're needed later.
	ns(ns(window, 'attache'), 'array').standard = std;

})();
