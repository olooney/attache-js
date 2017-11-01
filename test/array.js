// forcibly install our algorithms for testing.
(function(aas, ap) {
	for ( var k in aas ) ap[k] = aas[k];
})(attache.array.standard, Array.prototype);

(function() {
	module("attache.array");

	// makes two assertions about a pair of objects: 
	//   1) that they compare/value-by-value, and 
	//   2) they are not the same object.
	function closeButNoCigar(actual, expected, message) {
		deepEqual(actual, expected, message);
		notStrictEqual(actual, expected, message);
	}

	// override the QUnits default raises to add type checking.  The standard specifies
	// TypeErrors should be thrown from these functions when something goes wrong.
	function raises(type, fn, message) {
		// any error type raise if called as raises(fn, message) (backwards compatible)
		if ( typeof fn !== 'function' && arguments.length <= 2 ) {
			message = fn;
			fn = type;
			try {
				fn();
				ok(false, message);
			} catch (e) {
				ok(true, message);
			}
		} else {
			try {
				fn();
				ok(false, message);
			} catch ( e ) {
				ok( e instanceof type, message);
			}
		}
	}

	var nums = [1,2,3,4,5];
	var psuedo = { 0: 'a', 1: 'b', 24: 'y', 25: 'z', length: 26 }
	var answers = [42];
	var scope = { y: 'x' }; // just a random scope object passed in to test passing 'this' in

	// overlap between index and lastIndexOf
	function sharedIndexOfTests(method) {
		// works at all
		equal(Array.prototype[method].length, 1);
		equal([][method](42), -1);
		equal(nums[method](42), -1);
		equal(answers[method](42), 0);
		for ( var i=0; i<5; i++ ) equal(nums[method](i+1), i);

		// works on non-arrays
		equal(Array.prototype[method].call(psuedo, 'y') , 24);
		equal(Array.prototype[method].call(psuedo, 'q') , -1);

		// make sure we're using strict equality
		equal(nums[method](null), -1);
		equal(nums[method](""), -1);
		equal(nums[method]("0"), -1);
		equal(nums[method]("1"), -1);
		equal([null][method](undefined), -1);
		equal([null][method](0), -1);

	}

	test('indexOf', function() {
		sharedIndexOfTests('indexOf');

		// starting indexes
		var dupes = [1,2,3,1,2,3,4,5];
		equal(dupes.indexOf(2), 1);
		equal(dupes.indexOf(1, 0), 0);
		equal(dupes.indexOf(2, 3), 4);
		equal(dupes.indexOf(2, 5), -1);
		equal(dupes.indexOf(5, 99), -1);
		equal(dupes.indexOf(1, -99), 0);
		equal(dupes.indexOf(5, -1), 7);
		equal(dupes.indexOf(4, -1), -1);
		equal(dupes.indexOf(3, -4), 5);
	});

	test('lastIndexOf', function() {
		sharedIndexOfTests('lastIndexOf');

		// starting indexes
		var dupes = [1,2,3,1,2,3,4,5];
		equal(dupes.lastIndexOf(2), 4);
		equal(dupes.lastIndexOf(1, 0), 0);
		equal(dupes.lastIndexOf(3, 2), 2);
		equal(dupes.lastIndexOf(2, 3), 1);
		equal(dupes.lastIndexOf(2, 4), 4);
		equal(dupes.lastIndexOf(2, 5), 4);
		equal(dupes.lastIndexOf(5, 99), 7);
		equal(dupes.lastIndexOf(5, -99), -1);
		equal(dupes.lastIndexOf(5, -1), 7);
		equal(dupes.lastIndexOf(4, -1), 6);
		equal(dupes.lastIndexOf(4, -2), 6);
		equal(dupes.lastIndexOf(4, -3), -1);
	});

	test('every', function() {
		equal(Array.prototype.every.length, 1);
		strictEqual([].every(function() { ok(false, 'not called'); return false; }), true);
		ok(nums.every(function(v,i,a) {
			strictEqual(this, scope, 'scope');
			strictEqual(a, nums, 'array');
			return v === i+1;
		}, scope));
		ok(Array.prototype.every.call(psuedo, function(v) { return v !== undefined; }, 'not called for missing keys'));
	});

	test('some', function() {
		equal(Array.prototype.some.length, 1);
		strictEqual([].some(function() { ok(false, 'not called'); return true; }), false);
		ok(!nums.some(function(v,i,a) {
			strictEqual(this, scope, 'scope');
			strictEqual(a, nums, 'array');
			return v !== i+1;
		}, scope));
		ok(!Array.prototype.some.call(psuedo, function(v) { return v === undefined; }, 'not called for missing keys'));
	});

	test('forEach', function() {
		expect(30);

		[].forEach(function() {
			ok(false, 'never called');
		});
		raises(TypeError, function() { [].forEach(); });
		raises(TypeError, function() { [].forEach(null); });

		var count = 0;
		function inc() { count++; }
		Array.prototype.forEach.call([], inc);
		[].forEach(inc);
		equal(count, 0);

		Array.prototype.forEach.call(nums, inc);
		nums.forEach(inc);
		equal(count, 10);

		Array.prototype.forEach.call(psuedo, inc);
		equal(count, 14);

		answers.forEach(function(v, i, a) {
			strictEqual(this, scope);
			equal(v, 42);
			strictEqual(i, 0);
			strictEqual(a, answers);
		}, scope);

		nums.forEach(function(v, i, a) {
			// general preconditions
			strictEqual(v, a[i]);
			ok(isFinite(i));
			ok(i >= 0);

			// specific to the nums test data
			equal(v, i+1);
		});
		equal(Array.prototype.forEach.length, 1);
	});

	test('filter', function() {
		equal(Array.prototype.filter.length, 1);

		raises(TypeError, function() { [].filter(); }, 'TypeError if no predicate');
		raises(TypeError, function() { [].filter(null)}, 'TypeError if uncallable predicate');

		deepEqual(nums.filter(function() { return false;}), []);
		closeButNoCigar(nums.filter(function() { return true;}), nums);

		deepEqual(nums.filter(function(n) { return Boolean(n % 2); }), [1,3,5]);

		deepEqual(Array.prototype.filter.call(psuedo, function() { return true;}), ['a','b','y', 'z']);
		deepEqual(Array.prototype.filter.call(psuedo, function(v, i) { return i%2; }), ['b','z']);

		nums.filter(function(v, i, a) {
			strictEqual(this, scope);
			strictEqual(a, nums);
			strictEqual(v, i+1);
			return true;
		}, scope);
	});

	test('map', function() {
		equal(Array.prototype.map.length, 1);

		raises(TypeError, function() { [].map(); }, 'TypeError if no predicate');
		raises(TypeError, function() { [].map(null)}, 'TypeError if uncallable predicate');

		var empty = [];
		closeButNoCigar(empty.filter(function(v) { ok(false);}), empty);
		closeButNoCigar(nums.filter(function(v) { return v;}), nums);
		closeButNoCigar(nums.filter(function(v,i) { return i+1;}), nums);

		// everything gets passed in correctly.
		nums.map(function(v, i, a) {
			strictEqual(this, scope);
			strictEqual(a, nums);
			strictEqual(v, i+1);
			return true;
		}, scope);

		deepEqual(['a','b','y', 'z'], Array.prototype.filter.call(psuedo, function(v) { return v;}));
	});

	// shared tests for reduce() and reduceRight(), which behave the same 
	// for associative reduction functions.
	function testReduce(method) {
		equal(Array.prototype[method].length, 1);

		function sum(x,y) { return x+y; }
		function product(x,y) { return x*y; }

		equal(nums[method](sum), 15);
		equal(nums[method](product), 120);

		equal(nums[method](sum, 0), 15);
		equal(nums[method](product, 1), 120);

		equal(nums[method](sum, 100), 115);
		equal(nums[method](product, 0), 0);

		
		// first arg is not callable
		raises(TypeError, function() { [][method](); });
		raises(TypeError, function() { [][method](null); });

		raises(TypeError, function() { [][method](sum); }, 'empty array, no initial accumulator');

		// single element arrays, or empty arrays with accumulator, return that
		// one value without ever calling the reducer.
		equal(answers[method](function() { throw new Error('don\'t call me!'); }), 42);
		equal([][method](function() { throw new Error('don\'t call me!'); }, 35), 35);

		// works on array-like objects too
		(function() { 
			equal(Array.prototype[method].call(arguments, sum), 10);
		})(1,2,3,4);

		var psuedoArray = { 0: 1, 1: 2, 2: 3, 3:4, length: 4 };
		equal(Array.prototype[method].call(psuedoArray, sum), 10);

		// when working on array-like objects, missing keys are safely skipped
		var psuedoArray = { 0: 1, 1: 2, 3: 3, 4:4, length: 5 };
		equal(Array.prototype[method].call(psuedoArray, sum), 10);
	}

	// non-associative reducers used by both the reduce() and reduceRight() tests,
	// although of course they behave differently for the two algorithms.
	function div(x,y) { return x/y; }
	function flatten(x,y) { return [].concat(x,y); }

	test("reduce", function() {
		testReduce("reduce");
		equal([2,3,4].reduce(div), (2/3)/4);
		deepEqual([1,[], 2,[3,4], 5, [6]].reduce(flatten), [1,2,3,4,5,6]);
	});

	test("reduceRight", function() {
		testReduce("reduceRight");
		equal([2,3,4].reduceRight(div), (4/3)/2);
		deepEqual([1,[], 2,[3,4], 5, [6]].reduceRight(flatten), [6,5,3,4,2,1]);
	});
})();
