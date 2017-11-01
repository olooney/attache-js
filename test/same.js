(function() {
	var qUnitSame = same;
	var same = attache.same;

	// TODO: lots more tests...
	module("attache.same");

	test('scalar', function() {
		ok( same('one', 'one'));
		ok( same(42, 6*7 ));
		ok(!same(42, 128 ));
		ok(!same(42, '42'));
		ok( same(0, 0));
		ok(!same(42, 'how many roads must a man walk down?'));
		ok(!same('one', 'two'));
	});
	
	test('uniques', function() {
		ok( same(null, null));
		ok( same(true, true));
		ok( same(false, false));
		ok( same(undefined, undefined));
		ok( same(NaN, NaN));
		ok( same(Infinity, Infinity));
		ok(!same(null, undefined));
		ok(!same(null, 0));
		ok(!same(null, false));
		ok(!same(null, NaN));
	});

	test('date', function() {
		var now = new Date;
		ok( same(now, new Date(now) ));
		ok(!same(now, new Date(0)  ));
	});

	test('array', function() {
		ok( same([], []));
		ok( same([1,2,3], [1,2,3]));
		ok(!same([1,2,3], [1,2,3,4]));
		ok(!same([1,2,3], [1,5,3]));
	});

	test('object', function() {
		ok( same({}, {}));
		ok( same({ x: 'x', y: 'y'}, { x: 'x', y: 'y'}));
		ok(!same({ x: 'x', y: 'y'}, { x: 'y', y: 'x'}));
	});
})();
