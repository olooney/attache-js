(function() {
	var lex = attache.lex;
	module('attache.lex');

	// test case with several comments in it
	var lines = 'function f(x /*lhs*/ ,y /*rhs*/) {\n // addition\nreturn x + y;\n /* if numbers are passed in, this does \n addition, but if strings are passed in, \n it does string concatination instead. */\n }\n';

	test('trivial', function() {
		var lexer = lex.trivial(['a', '+', 'b']);
		strictEqual(lexer(), 'a');
		strictEqual(lexer(), '+');
		strictEqual(lexer(), 'b');
		strictEqual(lexer(), null);
		strictEqual(lexer(), null);
	});

	test('simple', function() {
		var lexer = lex.regular('2*23+731*61', /\d+|\+|\*/img);
		strictEqual(lexer(), '2');
		strictEqual(lexer(), '*');
		strictEqual(lexer(), '23');
		strictEqual(lexer(), '+');
		strictEqual(lexer(), '731');
		strictEqual(lexer(), '*');
		strictEqual(lexer(), '61');
		strictEqual(lexer(), null);
		strictEqual(lexer(), null);

		var lexer = lex.regular('', /\d+|\+|\*/img);
		strictEqual(lexer(), null);
	});

	test('unexpected', function() {
		var lexer = lex.regular('1+2^3', /\d+|\+|\*/img);
		strictEqual(lexer(), '1');
		strictEqual(lexer(), '+');
		strictEqual(lexer(), '2');

		raises(function() {
			lexer();
		}, function(e) {
			var message = e.toString();
			ok(/unexpected/.test(message), 'unexpected keyword in error message');
			ok(/"\^"/.test(message), 'unexpected substring included in error message');
			return e instanceof Error;
		}, 'throws an exception if any character does not match');
	});

	test('escapeRegExp', function() {
		equal(lex.escapeRegExp(''), '');
		equal(lex.escapeRegExp('hello there'), 'hello there');
		equal(lex.escapeRegExp('\\s+'), '\\\\s\\+');
		equal(lex.escapeRegExp('([^0-9]|\\w{2,3})'), '\\(\\[\\^0-9\\]\\|\\\\w\\{2,3\\}\\)');
	});

	test('joinRegExp', function() {
		// throws on empty pattern
		raises(function() { 
			lex.joinRegExp([], []);
		}, 'completely empty');
		raises(function() {
			lex.joinRegExp(['\\s+', '\\w+', ''], '+-*/'.split(''))
		}, 'empty pattern at 2');
		raises(function() {
			lex.joinRegExp(['\\s+', '\\w+', undefined], '+-*/'.split(''))
		}, 'undefined pattern at 2');
		raises(function() {
			lex.joinRegExp(['\\s*', '\\w+', undefined], '+-*/'.split(''))
		}, 'matches empty string');
		
		// correctly matches both regex patterns and escaped symbols
		var re = lex.joinRegExp(['\\s+', '\\w+'], '+-*/'.split(''))
		ok(re.test('  '), 'whitespace pattern');
		re.lastIndex = 0;
		ok(re.test('thanks'), 'matches word pattern');
		re.lastIndex = 0;
		ok(re.test('+'), 'matches symbol');
		re.lastIndex = 0;
		ok(re.test('*'), 'matches escaped symbol');
		re.lastIndex = 0;
		ok(!re.test('^'), 'doesn\'t match unknown symbol');
		ok(!re.test(''), 'empty');

	});

	test('lines', function() {
		var src = [
			'/* a simple program */',
			'void main(int argc, char** argv) {',
			'  // parse the arguments',
			'  if ( argc < 3 ) {',
			'    // not enough required arguments... ',
			'    cerr << "usage: " << argv[0] << " ACTION FILE [FILE...]" << endl;',
			'    return 1;',
			'  }',
			'  /* multiply the first command line argument (as a long)',
			'  by approximately PI and output it to the screen. */',
			'  cout << "sum: " << atol(argv[1]) * +3.14159e0 << endl; ',
			'  return 0;',
			'}'
		].join('\n');

		var p = lex.patterns;
		pattern = lex.joinRegExp(
			[
				p.whitespace,
				p.identifier,
				p.comment,
				p.multiLineComment,
				p.doubleQuotedString,
				p.integer // intentionally too weak
			], 
			'{}[]()<>;</*+-,!&|?:'.split('')
		);

		raises(function() {
			var lexer = lex.regular(src, pattern),
				word;
			while ( word = lexer() );
		}, function(e) {
			ok(e instanceof Error, 'Error type exception');
			ok( /line 11/.test(e), 'line number');
			ok(/column 40/.test(e), 'column');
			return true;
		}, 'raises on bad input');

		var p = lex.patterns;
		pattern = lex.joinRegExp(
			[
				p.whitespace,
				p.identifier,
				p.comment,
				p.multiLineComment,
				p.doubleQuotedString,
				p['float'] // fixed
			], 
			'{}[]()<>;</*+-,!&|?:'.split('')
		);

		var lexer = lex.regular(src, pattern),
			words = [],
			word;
		while ( word = lexer() ) words.push(word);
		equal( words.join(''), src, 'reconstruction' );
	});
})();
