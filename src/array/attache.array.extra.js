(function() {
	var extra = {
		// if you know an array is already sorted, it's easy to sort:
		uniqueSorted: function(array) {
			var len = array.length,
				last = array[0],
				uniques =  [last];
			if ( len == 0 ) return []

			for ( var i=1; i < len; i++ ) {
				var current = array[i];
				if ( last !== current ) {
					uniques.push(current);
					last = current;
				}
			}
			return uniques;
		},

		// the most general case, of arbitrary objects, functions,
		// or mixed objects. Doesn't support NaN.
		unique: function(array) {
			return array.filter(function(value, index) {
				return array.indexOf(value) === index;
			});
		},

		// SIDE-EFFECTS! MUTATES THE TARGET ARRAY!
		remove: function(array, value) {
			return extra.removeIf(array, function(item) {
				return item === value;
			});
		},

		// SIDE-EFFECTS! MUTATES THE TARGET ARRAY!
		removeIf: function(array, predicate, scope) {
			var a = array,
				l = a.length,
				index = 0; // original index
			for ( var i=0; i<l; i++ ) {
				if ( predicate.call(scope, a[i], index, a) ) {
					a.splice(i, 1);
					i--;
					l--;
				}
				index++;
			}
			return array;
		},

		indexIf: function(array, predicate, scope, startIndex) {
			var a = array,
				l = array.length,
				i = startIndex || 0; // index

			// constrain to range
			if ( i < 0 ) i = 0;

			for ( ; i < l; i++ ) {
				if ( predicate.call(scope, a[i], i, a) )
					return i;
			}
			return -1;
		},

		lastIndexIf: function(array, predicate, scope, startIndex) {
			var a = array,
				l = array.length,
				i = l-1; // index

			// use the optional startIndex if passed in
			if ( typeof startIndex == 'number' ) {
				i = startIndex;

				// constrain to range
				if ( i >= l ) i = l-1; 
			}

			for ( ; i >= 0; i-- ) {
				if ( predicate.call(scope, a[i], i, a) )
					return i;
			}
			return -1;
		}
	};
	var a = attache = window.attache || {};
	a.array = a.array || {};
	a.array.extra = extra;
})();

aae = attache.array.extra;
