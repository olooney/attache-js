(function() {
	var calculate = attache.calculator.calculate;
	module('attache.calc');

	function testCalculation(expression, result) {
		equal( calculate(expression, result), result, expression );
	}

	test('calc', function() {
		testCalculation('1', 1);
		testCalculation('1+1', 2 );
		testCalculation('5 - 2', 3);
		testCalculation('(4)', 4);
		testCalculation('(((5)))', 5);
		testCalculation(' 1+2*3+4*(5+6)- 9 ', 42);
		testCalculation('sin(pi/3) - sqrt(3)/2', 0);

		raises(function() {
			calculate('');
		}, function(e) {
			return e instanceof Error && e.message === 'unexpected (final)';
		});

		raises(function() {
			calculate('3++');
		}, function(e) {
			return e instanceof Error && e.message === 'unexpected +';
		});

		raises(function() {
			calculate('(1 * (2+3)');
		}, function(e) {
			return e instanceof Error && e.message === 'expected ) but got (final) at line 1 column 10';
		});

	});
})();
