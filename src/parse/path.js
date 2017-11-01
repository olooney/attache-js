owl.namespace("owl.path", function() {
	var g = new owl.parse.Grammar;

	g.binaryOperator('.', 80, function(obj, attr) {
		return obj[attr];
	});

	with ( owl.lex.patterns ) {
		var pattern = [
			'[.:+\\-*%\\/\\[\\]()\\|]|<=|>=|<|>|==|!=|&&|\\|\\|',
			singleQuoteStringLiteral,
			doubleQuoteStringLiteral,
			identifier,
			integerNumber
		].join('|');
	}

	function evaluate(obj, filters, path) {
		var lexer = owl.lex.regex(path, new RegExp(owl.path.pattern, 'g'));
		var parser = new owl.parse.Parser(lexer, g.getTokenFactory());
		var result = parser.parse();
		parser.expect('(final)');
		return result;
	}

	return {
		pattern: pattern,
		grammar: g,
		evaluate: evaluate
	}
});
