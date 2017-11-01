// The author disclaims copyright to this code.

// Provides core Object Oriented Programming constructs:
//   namespace
//   clone
//   extend
//   subclass

// This file is hand-minified to make it as lightweight as possible. The only
// compromise I wasn't willing to make is in the visible signatures of the functions;
// function name, length, and argument names are invaluable when debugging.

(function() {
	// set up a global namespace.
	var a = attache = window.attache || {};

	// Function x(Object target, Array extensions, Number initialIndex) -> Object
	//   Private function implementing an idea common to several of the
	//   public utilities: looping through a set of extension Objects
	//   one-by-one and adding all their properties to a single target Object.
	//   This is basically the functionality of extend(), but with a slightly more
	//   complex so it can be called directly from clone() and subclass() without
	//   messing around with arguments.
	function x(t, xs, i ) {
		// t : target object
		// xs : extension Objects
		// i : index
		var x, // ith extension Object
			l, // length
			k; // key

		// allow the target object to be passed in as null or undefined.
		if ( !t ) t = {};

		// the same algorithm as extend starting from the second argument.
		l = xs.length;
		for ( ; i < l; i++ ) {
			x = xs[i];
			if ( x ) 
				for ( k in x ) 
					t[k] = x[k];
		}
		return t
	}

	// Function extend(Object obj, Object extra...) -> Object
	//   updates an object by adding on as many additional objects 
	//   as you want. The updated object itself is returned. This can
	//   be used for mixins, providing default options, and many other cases.
	function extend(obj) {
		return x(obj, arguments, 1)
	}
	a.extend = extend;

	// Function namespace(String path, Function(Object ns) body?) -> Object
	//   path is the dotted global name of the namespace, for example, 'my.app'
	//   If a global object with that name doesn't exist yet, one is created;
	//   in either case it is passed to the body function. The body function
	//   can either add stuff to that object, or it can return an object which
	//   will be automatically added to the namespace. Finally, the namespace
	//   object is returned.
	function namespace(path, body) {
		// split the path into pieces and follow it down from the
		// global window object, creating objects as necessary
		// to guarantee an Object exists are every step.
		var ns = window, // start at the global namespace;
		ps = path.split('.'), // pieces
		l = ps.length, // length
		i = 0, // index
		p; // piece
		for ( ; i < l; i++ ) {
			p = ps[i];
			if ( !ns[p] ) ns[p] = {};
			ns = ns[p];
		}
		// after the loop, ns points to final namespace object.

		// execute the body of the namespace and pass it the 
		// namespace object so it can install its own public objects,
		// or return public objects to be added automatically.


		// The namespace object itself is returned in case you want to
		// assign a short alias to a nested namespace.
		return body ? extend(ns, body(ns)) : ns
	}
	a.namespace = namespace;

	// Function clone(Object obj, Object extra...) -> Object
	//   skip creating a class with a constructor and just clone a single
	//   object using native JavaScript prototype-based inheritance.
	//   just like extend, you can pass through as many extra objects to
	//   add to the target as you want.
	function clone(obj /*, [extra, ...] */ ) {
		if ( typeof obj == 'object' ) {
			function C() {} // one-off Clone class
			C.prototype = obj;
			var c = new C;
		} else c = {};

		// extend the cloned object with any extra extension objects
		return x(c, arguments, 1)
	}
	a.clone = clone;

	// subclass(Function constructor, Function superclass, Object members...) -> Function
	//   define a new subclass of an existing class.  Pass "Object"
	//   as the superclass to define a new, top-level class. You can pass through
	//   an object to initialize the methods and static members of your new class.
	//   The original constructor is returned.
	function subclass(constructor, superclass) {
		var c = constructor, // could also stand for "class", if you prefer
			sc = superclass,
			scp = sc.prototype,

			// clone the prototype of the superclass to set up the right prototype
			// relationship without invoking the superclass constructor.
			p = clone(scp);

		// set up native inheritance and copy the members onto the new prototype.
		x(p, arguments, 2);
		c.prototype = p;

		// it's also recommended that an object's "constructor" property be a reference
		// back to the constructor. Native classes like Date and Array do this. By
		// setting this property on the prototype, we cheaply ensure it's on every object.
		p.constructor = c;

		// finally, it's also really helpful to keep references back to the superclass
		// and it's prototype. Strictly speaking we don't need to keep both: we could write
		// `MyClass._superclass.prototype` instead of `MyClass._super` or 
		// `MyClass._super.constructor` instead of `MyClass._superclass`. 
		c._superclass = sc;
		c._super = scp;

		return c
	}
	a.subclass = subclass;

})();
