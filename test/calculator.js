attache.namespace("attache.calculator", function() {
	var p = attache.parse;
	var g = new p.Grammar();
    var environment = {};
    var globalEnvironment = {
        answer: 42,
        pi: Math.PI,
        e: Math.E,
        sqrt: function(x) { return Math.sqrt(x); },
        sin: function(x) { return Math.sin(x); },
        cos: function(x) { return Math.cos(x); },
        ln: function(x) { return Math.log(x); },
        log: function(x) { return Math.log10(x); },
        exp: function(x) { return Math.exp(x); },
        avg: function(x, y) { return (x+y)/2; }
    };
	
	g.ignore('\\s+');

	g.binaryOperator('+', 50, function(x,y) { return x + y });
	g.binaryOperator('-', 50, function(x,y) { return x - y });
	g.binaryOperator('*', 60, function(x,y) { return x * y });
	g.binaryOperator('/', 60, function(x,y) { return x / y });
	g.binaryOperator('^', 70, function(x,y) { return Math.pow(x,y); }, true);

	g.binaryOperator(',', 30, function(x,y) { return [x, y] });

	// parentheses
	g.symbol('(', 0, {
		nud: function(parser) {
			var left = parser.parse();
			parser.expect(')');
			return left;
		}
	});
	g.symbol(')');

	// ternary operator
	g.symbol('?', 40, {
		led: function(parser, left) {
			var conditional = left;
			var positive = parser.parse();
			parser.expect(':');
			var negative = parser.parse();
			if ( conditional ) return positive;
			else return negative;
		}
	});
	g.symbol(':');

    g.registerPattern("^([A-Za-z])(\\d\\d?)$", function(word) {
        function ord(letter) { return letter.toUpperCase().charCodeAt(0); }

        return attache.clone(p.tokenPrototype, {
            word: word,
            nud: function(parser) {
                var referenceRegex = /^([A-Z])(\d\d?)$/i;
                var match = referenceRegex.exec(word);
                var row = match[2];
                var column = 1 + ord(match[1]) - ord('A');
                return Number(environment.grid[row-1][column-1]);
            }
        });
    });

    g.registerPattern(attache.lex.patterns.identifier, function(word) {
        return attache.clone(p.tokenPrototype, {
            word: word,
            nud: function(parser) { 
                var ident = String(word).toLowerCase();
                var value = environment[ident] || 0; 
                if ( typeof(value) == 'function' ) {
                    
                    // functions must be followed by parenthetical arguments
                    parser.expect('(');
                    var args = parser.parse();
                    parser.expect(')');

                    // wrap single args in an array
                    if ( !(args instanceof Array) ) {
                        args = [args];
                    }
                    return value.apply(environment, args);
                } else {
                    return value;
                }
            }
        });
    });

	// not a symbol: must be a number.
	g.registerPattern(attache.lex.patterns.float, function(word) {
		return attache.clone(p.tokenPrototype, {
			word: word,
			nud: function() { return parseFloat(this.word); }
		});
	});

	function newLexer(input) {
		var re = attache.lex.joinRegExp(g.getPatterns(), g.getSymbols());
		return attache.lex.regular(input, re);
	}

	function calculate(input, env) {
        environment = attache.clone(globalEnvironment, env);
		var lexer = newLexer(input);
		var tokenizer = g.getTokenizer();
		var parser = new p.Parser(lexer, tokenizer);
		var result = parser.parse();
		parser.expect('(final)');
		return result;
	}

	return {
		grammar: g,
		newLexer: newLexer,
		calculate: calculate
	}
});

