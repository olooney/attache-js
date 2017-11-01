// The author disclaims copyright to this code.
(function() {
	var ao = attache.object;
	module("attache.object");
	
	var ident = { x: "x", y: "y" };
	var nums = { zero: 0, one: 1, two: 2, three: 3 };
	var empty = {};
	function sum(x,y) { return x+y; }

	function raisesOnBadArgs(fn) {
		// the first argument must be an object
		raises(function() { fn(); });
		raises(function() { fn(42); });

		// the second argument must be a function,
		// and an exception must be thrown even if
		// the target object is empty.
		raises(function() { fn(empty); });
	}

	// validates that the algorithm invokes the callback
	// function with the correct scope and arguments.
	// ret is a configurable return value used to make
	// sure it loops over the full object.
	function testCallbackArgs(fn, ret) {
		var count = 0;
		fn(ident, function(value, key, obj) { 
			strictEqual(key, value);
			strictEqual(obj[key], value);
			strictEqual(obj, ident);
			strictEqual(this, empty);
			count++;
			return ret;
		}, empty);
		equal(count, 2, "reached all items");
	}

	test("forEach", function() {
		expect(12);
		raisesOnBadArgs(ao.forEach);
		testCallbackArgs(ao.forEach);

		ao.forEach(empty, function() {
			ok(false, "fn shouldn't be called for empty");
		});
	});

	test("keyOf", function() {
		expect(6);
		raises(function() { ao.keyOf(); });
		raises(function() { ao.keyOf(42); });
		
		equal(ao.keyOf(nums, 0), "zero");
		equal(ao.keyOf(nums, 3), "three");
		
		strictEqual(ao.keyOf(nums, 5), undefined, 'undefined if not found');
		strictEqual(ao.keyOf(nums, "3"), undefined, 'uses === to match value');
	});

	test("every", function() {
		expect(16);
		raisesOnBadArgs(ao.every);
		testCallbackArgs(ao.every, true);

		strictEqual(ao.every(empty, function() { return false; }), true);
		ao.every(empty, function() { ok(false); });
		ok(ao.every(nums, function() { return true; }));
		ok(!ao.every(nums, function() { return false; }));

		strictEqual(ao.every(nums, function(value, key) { return value < 2; }), false);
	});

	test("some", function() {
		expect(16);
		raisesOnBadArgs(ao.some);
		testCallbackArgs(ao.some, false);

		ok(!ao.some(nums, function() { return false; }));
		ok(ao.some(nums, function() { return true; }));
		strictEqual(ao.some(empty, function() { return true; }), false);
		ao.some(empty, function() { ok(false); });

		strictEqual(ao.some(nums, function(value, key) { return value > 2; }), true);
	});

	test("filter", function() {
		expect(18);
		raisesOnBadArgs(ao.filter);
		testCallbackArgs(ao.filter);

		deepEqual(ao.filter(empty, function() { return true; }), {});
		notStrictEqual(ao.filter(empty, function() { return true; }), empty);
		deepEqual(ao.filter(nums, function() { return false; }), {});
		deepEqual(ao.filter(nums, function() { return true; }), nums);

		deepEqual(ao.filter(nums, function(value, key) {
			return (value % 2) === 0;
		}), { zero: 0, two: 2 });

		deepEqual(ao.filter(nums, function(value, key) {
			return (key.charAt(0) === 't');
		}), { two: 2, three: 3 });
	});

	test("reduce", function() {
		expect(13);

		raisesOnBadArgs(ao.reduce);
		raises(function() { ao.reduce(empty, sum); });

		// for an empty Object, the accumulator function is never called,
		// and the initial accumulator is simply returned as-is.
		equal( ao.reduce(empty, function() { ok(false); }, 42), 42)

		equal( ao.reduce(nums, sum), 6 );
		equal( ao.reduce(nums, function(x,y) { return x*y; }), 0 );

		ao.reduce(ident, function(left, right, key, obj) {
			// validate the four arguments of the reduce callback
			strictEqual(left, empty);
			strictEqual(right, obj[key]);
			strictEqual(obj, ident);
			return left;
		}, empty);
	});


	test("map", function() {
		expect(15);
		raisesOnBadArgs(ao.map);
		testCallbackArgs(ao.map);

		deepEqual(ao.map(empty, function() { return 42; }), empty);
		deepEqual(ao.map(nums, function(value, key) { return value; }), nums);

		deepEqual(ao.map(nums, function(value, key, obj) {
			if ( key.charAt(0) === 't' ) return value * 2;
			else return value;
		}), { zero: 0, one: 1, two: 4, three: 6 });
	});

	test("mapToArray", function() {
		raisesOnBadArgs(ao.mapToArray);
		testCallbackArgs(ao.mapToArray);

		deepEqual(ao.mapToArray(ident, sum), ['xx', 'yy']);
	});
	test("pop", function() {
		expect(7);
		// object is required.
		raises(function() { ao.pop(); });

		// pop is destructive, so use a private test object
		var musicians = { bob: "marley", bill: "clinton", lady: "gaga" };

		// pop a key off
		ok( 'lady' in musicians );
		equal( ao.pop(musicians, 'lady'), 'gaga' );
		ok( !('lady' in musicians) );

		// non-existant key does nothing, returns undefined
		strictEqual( ao.pop(musicians, 'dude'), undefined );

		// move a value from one key to another.
		musicians.george = ao.pop(musicians, 'bill');
		ok(!musicians.bill);
		equal(musicians.george, 'clinton');
	});
	test("length", function() {
		expect(4);
		raises(function() { ao.length(); });
		equal(ao.length(empty), 0);
		equal(ao.length(ident), 2);
		equal(ao.length(nums), 4);
	});
	test("empty", function() {
		expect(3);
		raises(function() { ao.empty(); });
		ok(ao.empty(empty));
		ok(!ao.empty(ident));
	});
	test("concat", function() {
		expect(8);
		deepEqual(ao.concat(), {});
		notStrictEqual(ao.concat(), ao.concat());

		var numbers = ao.concat(nums, undefined, empty);
		deepEqual(numbers, nums);
		notStrictEqual(numbers, nums);

		var numbers2 = ao.concat(numbers, { four: 4 });
		equal(numbers2.four, 4);

		// make sure we're not accidentily reusing/mutating an object
		numbers.five = 5;
		numbers2.six = 6;
		ok( !numbers2.five );
		ok( !numbers.six );

		var pets = ao.concat({ 
			dog: 'wag', 
			cat: 'purr'
		}, { 
			fish: 'swim'
		}, { 
			frog: 'stare', 
			cat: 'scratch'
		});
		deepEqual(pets, {
			dog: 'wag',
			cat: 'scratch',
			fish: 'swim',
			frog: 'stare'
		});
	});
	test("slice", function() {
		expect(11);
		raises(function() { ao.slice(); })
		raises(function() { ao.slice({}); })
		raises(function() { ao.slice({}, 'testing'); })
		
		var empty2 = ao.slice(empty, []);
		deepEqual(empty, empty2);
		notStrictEqual(empty, empty2);

		var nums2 = ao.slice(nums, ao.keys(nums));
		deepEqual(nums, nums2);
		notStrictEqual(nums, nums2);

		deepEqual( ao.slice(ident, ['x']), { x: 'x' } );

		deepEqual( ao.slice(ident, []), empty);
		deepEqual( ao.slice(ident, ['w', 'z']), empty);

		deepEqual( ao.slice(nums, 'one two billion'.split(' ')), { one: 1, two: 2} );
	});
	test("splice", function() {
		raises(function() { ao.splice(); })
		raises(function() { ao.splice({}); })
		raises(function() { ao.splice({}, 'testing'); })

		var empty2 = ao.splice(empty, []);
		deepEqual(empty, empty2);
		notStrictEqual(empty, empty2);

		// splice out all keys
		var nums2 = ao.copy(nums);
		var nums3 = ao.splice(nums2, ao.keys(nums2));
		notStrictEqual(nums2, nums3);
		deepEqual(nums2, empty); // all keys removed
		deepEqual(nums3, nums); // and moved to the other object

		// splice out half the keys
		var ident2 = ao.copy(ident);
		var ident3 = ao.splice(ident2, ['x']);
		deepEqual(ident2, { y: 'y' });
		deepEqual(ident3, { x: 'x' });

		// skip non-existant keys
		var pets = { cat: 'Sam', dog: 'Mark', fish: 'Dave' };
		var myPets = ao.splice(pets, ['turtle', 'cat', 'walrus']);
		ok( !('walrus' in myPets) );
		deepEqual(myPets, { cat: 'Sam' });
		deepEqual(pets, { dog: 'Mark', fish: 'Dave' });

	});
	test("keys", function() {
		expect(3);
		raises(function() { ao.keys(); });
		deepEqual(ao.keys(empty), []);
		deepEqual(ao.keys(ident), ['x', 'y']);
	});
	test("values", function() {
		expect(3);
		raises(function() { ao.values(); });
		deepEqual(ao.values(empty), []);
		deepEqual(ao.values(ident), ['x', 'y']);
	});
	test("pairs", function() {
		expect(3)
		raises(function() { ao.pairs(); });
		deepEqual(ao.pairs(empty), []);
		deepEqual(ao.pairs(ident), [['x','x'], ['y', 'y']]);
	});
	test("copy", function() {
		expect(5)
		raises(function() { ao.copy(); });
		deepEqual(ao.copy(empty), {});
		notStrictEqual(ao.copy(empty), empty);
		deepEqual(ao.copy(ident), ident);
		notStrictEqual(ao.copy(ident), ident);
	});
})();
