(function() {
	// attache.lex namespace
	window.attache = window.attache || {};
	var lex = window.attache.lex = window.attache.lex || {};

	// Function position(String src, Number index) -> Position
	//   Determines the line number and column of the given index in a string.
	// Returns a Position object with keys character, line, and column. Used
	// internally to provide line numbers for errors.
	lex.position = function(s, i) {
		var p = /\n/mg, // newline pattern, works for both unix and windows conventions
			lc = 1,     // line counts conventionally start at one.
			m,          // regular expression match object
			li = 0;     // last index

		// final index is optional; if omitted, gives a full line count.
		if ( i == undefined ) i = s.length;

		while ( (m = p.exec(s)) && m.index < i ) {
			lc++;
			li = m.index;
		}
		return {
			character: i,
			line: lc,
			column: i - li,
			toString: function() {
				return 'line ' + this.line + ' column ' + this.column;
			}
		};
	}

	// Concept: Lexer
	//   A Lexer is a Function which returns a different String word
	// each time it is called until it reaches the end of it's
	// source input, after which it only returns null.
	//   A lexer can also optionally provide a "position()" method,
	// which returns a Position object about it's current location
	// for debugging purposes.

	// Function trivial(Array words) -> Lexer
	// A trivial lexer, useful for debugging because you
	// can completely control the contents of each word.
	lex.trivial = function(words) {
		var i = 0;
		function lexer() {
			if ( i < words.length ) return words[i++];
			else return null;
		}
		lexer.position = function() {
			return {
				wordIndex: i,
				toString: function() { return 'word ' + this.wordIndex; }
			}
		}
		return lexer;
	}

	// Function regular(String source, RegExp regex) -> Lexer
	// A "regular lexer" uses a RegExp to break a string into words.
	// The words form a partition of the original string: if recombined,
	// they would reconstruct the original exactly. If the regular
	// expression provided isn't able to match anything in the original,
	// then an Error is thrown with the unmatched text as well as a line
	// and column numbers for debugging.
	lex.regular = function(source, regex) {
		var finished = false;
		var expectedIndex = 0;
		function lexer() { 
			if ( finished ) return null;
			var match = regex.exec(source);
			if ( match ) {
				var word = match[0];
				if ( match.index !== expectedIndex ) {
					throw Error(
						'encountered unexpected : "' + 
						source.slice(expectedIndex, match.index) + 
						'" on line ' + lex.position(source, expectedIndex)
					);
				}
				expectedIndex = match.index + word.length;
				return match[0];
			}
			finished = true;
			return null;
		}
		lexer.position = function() {
			return lex.position(source, expectedIndex);
		}
		return lexer;
	}

	// Function escapeRegExp(String pattern) -> String
	// escapes any string so it can be used to construct a regular expression.
	// For example, "Thanks for coming. How are you?" becomes "Thanks for
	// coming\\. How are you\\?" If you pass the result into the RegExp
	// constructor, you'll get a pattern that matches the original sentence,
	// and does NOT match "Thanks for coming! How are yo".
	lex.escapeRegExp = function(pattern) {
		return String(pattern).replace(/[.*+?|()[\]{}\\^$]/g, "\\$&");
	}

	// Function joinRegExp(String[] patterns, String[] symbols) -> RegExp
	//   Joins arrays of possible word patterns into a regular expression. The
	// first array of patterns are already in regular expression syntax, the second
	// array of symbols are exact string matches and will be escaped before being
	// included in the RegExp. All patterns and symbols are joined on the regular
	// expression "|" operator, so that any pattern or symbol will match. The regular
	// expression returned will always use the flags "mg" (multi-line, global) which
	// makes the most sense for a lexer.
	lex.joinRegExp = function(patterns, symbols) {
		var i;
		patterns = patterns.slice(); // copy before we start adding symbols

		for ( i=0; i < patterns.length; i++ ) {
			if ( !patterns[i] ) throw Error("missing pattern at index " + i);
		}

		// escape each symbol
		if ( symbols ) {
			for ( i=0; i < symbols.length; i++ ) {
				if ( !symbols[i] ) throw Error("missing symbol at index " + i);
				patterns.push(lex.escapeRegExp(symbols[i]));
			}
		}

		var re = new RegExp(patterns.join('|'), "mg");
		if ( re.test('') ) throw Error("RegExp " + re + " matches empty string and cannot be used for a lexer.");
		return re;
	}

	// some commonly seen complex token patterns.
	// by joining these together with | with your own symbol and using
	// the new RegExp constructor, you can quickly make regular lexers
	// for your grammar.
	lex.patterns = {
		whitespace: "\\s+",
		singleQuotedString: "'(\\\\.|[^'])*'",
		doubleQuotedString: '"(\\\\.|[^"])*"',
		comment: '//.*',
		multiLineComment: '/\\*(.|[\\r\\n])*?\\*/',
		integer: '-?(0|([1-9][0-9]*))',
		"float": '-?((0|([1-9][0-9]*))(\\.[0-9]+)?|\\.[0-9]+)([eE][-+]?[0-9]+)?',
		identifier: '[$_a-zA-Z][$_a-zA-Z0-9]*',
		regularExpression: '/(\\\\.|[^/])+/[igm]*' // woah.
	}
})();

