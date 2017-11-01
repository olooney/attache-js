// The author disclaims copyright to this code.
(function() {
	module("attache.oop");

	test('namespace', function() {
		expect(8);
		var omm = attache.namespace('owl.movie.models', function(m) { 
			m.Guy = 'Guy';
			owl.movie.models.Gal = 'Gal';
			return { 
				Gun: 'Gun'
			}; 
		});

		// three supported ways of adding objects to the namespace
		equal(owl.movie.models.Guy, 'Guy');
		equal(owl.movie.models.Gal, 'Gal');
		equal(owl.movie.models.Gun, 'Gun');

		// returned a reference to the namespace
		strictEqual(omm, owl.movie.models);

		// add stuff to the same namespace later without wiping it out.
		attache.namespace('owl.movie.models', function(m) {
			m.Gin = 'Gin';
		});
		strictEqual(omm, owl.movie.models);
		equal(owl.movie.models.Gun, 'Gun');
		equal(owl.movie.models.Gin, 'Gin');

		// function parameter is optional: if not passed in, set up 
		// and return the namespace object and just doesn't populate it.
		var omv = attache.namespace('owl.movie.views');
		deepEqual(omv, {});

		delete owl; // so we still pass the tests with NoGlobals set

	});

	test("clone", function() {
		expect(22);
		var empty = {};
		deepEqual(empty, attache.clone());

		// clone a guy
		var guy = { name: 'Joe Smith', age: 88, gender: 'Male', pets: ['dog', 'cat'] };
		var guy2 = attache.clone(guy);
		deepEqual(guy, guy2); // guys start out fuctionally equivalent

		// change to the original are picked up right away
		guy.name = 'John Smith';
		equal(guy.name, 'John Smith');
		equal(guy2.name, 'John Smith');

		// nested properties are shared by reference
		strictEqual(guy.pets, guy2.pets);
		guy.pets.push('parrot');
		guy2.pets.push('turtle');
		equal(guy.pets.length, 4);
		equal(guy2.pets.length, 4);

		// override a field
		guy2.age = 21;
		equal(guy.age, 88);
		equal(guy2.age, 21);

		// the override masks changes to the prototype.
		guy.age++;
		equal(guy.age, 89);
		equal(guy2.age, 21);

		// pick up the change when unmasked
		delete guy2.age;
		equal(guy.age, 89);
		equal(guy2.age, 89);

		// clone a guy and mutate him
		var superHero = attache.clone(guy, { power: 'Flight', hero: true });
		equal(superHero.power, 'Flight');
		strictEqual(superHero.hero, true);

		// clone a guy, mutate him, and have him descend into villany
		var superVillian = attache.clone(guy, { power: 'Regeneration', hero: true }, { hero: false, quirk: 'disfigurement' });
		equal(superVillian.power, 'Regeneration');
		strictEqual(superVillian.hero, false);
		equal(superVillian.quirk, 'disfigurement');

		// undefined values are allowed, result in default behavior.
		var nums = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
		deepEqual(attache.clone(nums, undefined), nums);
		deepEqual(attache.clone(undefined), empty);
		deepEqual(attache.clone(undefined, undefined), empty);
		deepEqual(attache.clone(undefined, undefined, undefined), empty);
	});

	test('extend', function() {
		expect(9);
		var nums = { zero: 0, one: 1 };
		var empty = {};

		strictEqual(empty, attache.extend(empty));
		deepEqual(empty, attache.extend(empty));

		deepEqual(nums, attache.extend({}, nums));
		notStrictEqual(nums, attache.extend({}, nums));

		attache.extend(nums, { two: 22, three: 3 }, { two: 2, four: 4 });
		deepEqual({ zero: 0, one: 1, two: 2, three: 3, four: 4 }, nums);
		attache.extend(nums, { z: 'z', twenty: 20 });
		deepEqual({ zero: 0, one: 1, two: 2, three: 3, four: 4, twenty: 20, z: 'z' }, nums);

		deepEqual(
			attache.extend({}, { x: 'x' }, null, undefined, false, {}, { y: 'y' }),
			{ x: 'x', y: 'y'}
		);

		var o = attache.extend(null, { a: 'a' });
		deepEqual(o, { a: 'a' });
		var o2 = attache.extend();
		deepEqual(o2, {});

	});

	test('subclass', function() {
		expect(25);

		function Node(tag) {
			this.tag = tag;
		}
		attache.subclass(Node, Object, {
			setParent: function(node) { 
				this.parentNode = node;
			},
			getParent: function() {
				return this.parentNode;
			},
			getChildren: function() { 
				return []; 
			},
			toString: function() {
				return "[abstract " + tag + " node]";
			}
		});

		var root = new Node('root');

		function BinaryOperator(op, leftNode, rightNode) {
			Node.call(this, 'op(' + op + ')');
			this.op = op;
			if ( leftNode ) {
				this.leftNode = leftNode;
				leftNode.setParent(this);
			}
			if ( rightNode ) {
				this.rightNode = rightNode;
				rightNode.setParent(this);
			}
		}
		attache.subclass(BinaryOperator, Node, {
			getChildren: function() {
				return [this.leftNode, this.rightNode];
			},
			toString: function() {
				return this.leftNode.toString() + this.op + this.rightNode.toString();
			}
		});
		strictEqual(BinaryOperator._superclass, Node);
		strictEqual(BinaryOperator._superclass, BinaryOperator._super.constructor);
		strictEqual(BinaryOperator._superclass.prototype, BinaryOperator._super);

		function Pow(leftNode, rightNode) {
			BinaryOperator.call(this, '**', leftNode, rightNode);
			this.op = ',';
		}
		var Pow2 = attache.subclass(Pow, BinaryOperator, {
			toString: function() {
				return 'Math.pow(' + Pow._super.toString.apply(this, arguments) + ')';
			}
		});
		strictEqual(Pow, Pow2);
		strictEqual(Pow._superclass, BinaryOperator);
		strictEqual(Pow._superclass, Pow._super.constructor);
		strictEqual(Pow._superclass.prototype, Pow._super);
		notStrictEqual(Pow.prototype.toString, BinaryOperator.prototype.toString);
		strictEqual(Pow.prototype.getChildren, BinaryOperator.prototype.getChildren);

		// prove we're setting up prototype chains, not copying properties.
		Node.prototype.hackedInLater = 42;
		equal(Pow.prototype.hackedInLater, 42);
		delete Node.prototype.hackedInLater;

		function NumberLiteral(value) {
			Node.call(this, 'number');
			this.value = value;
		}
		attache.subclass(NumberLiteral, Node, {
			toString: function () {
				return String(this.value);
			}
		});


		var expr = new BinaryOperator('+',
			new Pow( 
				new NumberLiteral(2), 
				new NumberLiteral(4) 
			),
			new BinaryOperator('*',
				new NumberLiteral(3), 
				new NumberLiteral(5)
			)
		);
		equal(expr.toString(), 'Math.pow(2,4)+3*5');
		equal(eval(expr.toString()), 31);
		strictEqual(expr.constructor, BinaryOperator);

		function visit(node, visitor) {
			visitor(node)
			var children = node.getChildren();
			for ( var i=0; i<children.length; i++ ) {
				visit(children[i], visitor);
			}
		}

		// runs 7 successful tests
		visit(expr, function(node) {
			ok( node instanceof Node, node.toString() + ' instanceof Node' );
		});

		// runs 4 successful tests
		visit(expr, function(node) {
			if ( node instanceof NumberLiteral ) {
				ok ( !(node instanceof BinaryOperator), 'separate branches of the class hierarchy');
			}
		});

		// runs 1 successful tests
		visit(expr, function(node) {
			if ( node instanceof Pow ) {
				ok ( node instanceof BinaryOperator, 'same branch of the class hierarchy');
			}
		});
	});

})();
