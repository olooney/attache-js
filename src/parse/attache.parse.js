// dependendencies: attache.oop

attache.namespace("attache.parse", function() {
	
	function at(lexer) {
		if ( lexer && typeof lexer.position === 'function' ) {
			return ' at ' + lexer.position();
		} else {
			return '';
		}
	}

	function Token(config) {
		attache.extend(this, config);
	}
	attache.subclass(Token, Object, {
		lbp: 0,
		word: "proto",
		nud: function(lexer, parser) { throw Error("unexpected " + this.word + at(lexer)); },
		led: function(lexer, parser, left) { throw Error("unexpected " + this.word + " operator" + at(lexer)); },
	});

	// the final token is used to cleanly and explicitly terminate token streams.
	var finalToken = new Token({ word: '(final)' });

	// the skip token is used to skip ignored patterns, such as whitespace.  Return this
	// skip token from the token factory to have the parser automatically skip to the next word.
	var skipToken = new Token({ word: '(skip)' });


	// A Grammar is a way to define a tokenizer using a symbol table for re-usable
	// tokens and registered handlers for literals and identifiers which require individual
	// construction.  After creating a grammar, define all your tokens and then call
	// getTokenizer() to get a function you can use to instantiate a parser.
	function Grammar() {
		this.symbolTable = {};
		this.registry = [];
	}
	attache.subclass(Grammar, Object, {
		symbol: function(word, lbp, options) {
			var token = new Token(options);
			token.word = word;
			if ( lbp ) token.lbp = lbp;
			return this.symbolTable[word] = token;
		},

		// convenience wrapper for symbol to handle the common binary operator case.
		binaryOperator: function(word, lbp, operator, rightAssociative) {
			var adjustment = rightAssociative ? -1 : 0;
			return this.symbol(word, lbp, {
				led: function(parser, left) { 
					return operator(left, parser.parse(lbp + adjustment)); 
				}
			});
		},

		// define an alias for an existing symbol
		alias: function(symbol, alias) {
			return this.symbolTable[alias] = this.symbolTable[symbol];
		},

		// register a token handler.  Pattern must be a string, representing the
		// a regular expression to match the words that the handler can handle.
		// It will be placed between ^ and $ and test()ed against each word.
		registerPattern: function(pattern, handler) {
			if ( typeof pattern !== 'string' ) {
				throw Error("pattern " + pattern + " must be a string");
			}
			if ( typeof handler !== 'function' ) {
				throw Error("pattern " + pattern + " must have a handler function");
			}
			this.registry.push({ 
				pattern: pattern, 
				regex: new RegExp('^' + pattern + '$'),
				handler: handler 
			});
		},

		// returns an array of all registered patterns, including ignored
		// patterns.  Each pattern is a string in regular expression format.
		getPatterns: function() {
			var patterns = [];
			for ( var i=0; i<this.registry.length; i++ ) {
				patterns.push(this.registry[i].pattern);
			}
			return patterns;
		},

		// returns an array of strings of registered symbols, including
		// aliases and operators.
		getSymbols: function() {
			var symbols = [];
			for ( var symbol in this.symbolTable ) {
				symbols.push(symbol);
			}
			return symbols;
		},

		ignore: function(pattern) {
			this.registerPattern(pattern, function() { return skipToken; });
		},

		// create a Token from the given word.  An optional context may
		// also be supplied.  The logic is as follows:
		//   1. if the word is null, the finalToken is returned.
		//   2. if the word is on the symbol table, that symbol's token is returned.
		//   3. failing that, each registered token handler's pattern will be checked.
		//   4. if the pattern matches, the handler will be called.
		//   5. if the handler returns a token, that will be returned.
		//   6. if it returns a null or other false value, we move on to the next 
		//      registered handler and start over from step 3.
		//   7. if no registered handler returns a token, an Error is thrown.
		createToken: function(word, context) {
			if ( word === null ) return finalToken;
			if ( word in this.symbolTable ) return this.symbolTable[word];
			for ( var i=0; i < this.registry.length; ++i ) {
				if ( this.registry[i].regex.test(word) ) {
					var token = this.registry[i].handler.call(this, word, context);
					if ( token ) return token;
				}
			}
			throw Error("unknown word " + word);

		},

		// get a bound tokenizer function that can be passed to a parser.
		// a "tokenizer" is passed a String word and an optional context
		// object, and is expected to return a Token or null.
		getTokenizer: function() {
			if ( !this.tokenizer ) {
				var grammar = this;
				this.tokenizer = function(word, context) {
					return grammar.createToken(word, context);
				}
			}
			return this.tokenizer;
		}
	});

	// A parser represents one pass of a parser.
	function Parser(lexer, tokenizer, context) {
		this.lexer = lexer;
		this.tokenizer = tokenizer;
		this.context = context;

		// the look-ahead stack of tokens.
		this.tokenStack = [];

		// private flag set when the lexer is out of tokens.  Note
		// that there may still be tokens on the stack so parsing isn't
		// necessarily complete.
		this.noMoreTokens = false;
	}
	attache.subclass(Parser, Object, {

		// consume and return the next token
		next: function() {
			if ( this.tokenStack.length ) return this.tokenStack.pop();
			if ( this.noMoreTokens ) return finalToken;
			do {
				var word = this.lexer();
				try { 
					var token = this.tokenizer(word, this.context);
				} catch ( e ) {
					throw new Error(String(e) + at(this.lexer));
				}
			} while ( token === skipToken );
			if ( token === finalToken ) this.noMoreTokens = true;
			return token;
		},

		// put a token back on the look-ahead stack; it will be read next.
		putBack: function(token) {
			this.tokenStack.push(token);
		},

		// look ahead to the next token without consuming any.
		peek: function() {
			var token = this.next();
			if ( token !== finalToken ) this.putBack(token);
			return token;
		},

		// consume the expected symbol or throw an Error.
		expect: function(expected) {
			var word = this.next().word;
			if (  word !== expected ) {
				throw Error("expected " + expected + " but got " + word + at(this.lexer));
			}
		},

		// the top-down parsing algorithm
		parse: function(rbp) {
			if ( !rbp ) rbp = 0;

			var token = this.next();
			var left = token.nud(this);

			token = this.peek();
			while ( rbp < token.lbp ) {
				this.next(); // consume the token we peeked at
				left = token.led(this, left);
				token = this.peek();
			}
			return left;
		}
	});

	return {
		Token: Token,
		finalToken: finalToken,
		skipToken: skipToken,
		Grammar: Grammar,
		Parser: Parser
	}
	
});

