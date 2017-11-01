attache.namespace('attache.event', function(ev) {

	// most of the options which are useful for event handlers can be handled
	// with functional manipulations, with rather little logic in the event
	// itself. This also allows downstream users to define their own event
	// options by adding a straight-forward function to optionHandlers.
	
	optionHandlers = {
		// bind the handler function to the given scope.
		scope: function(fn, scope) {
			return function() { 
				return fn.apply(scope, arguments);
			}
		},

		// fire only once, then throw the listener away.
		// TODO: special logic to unregister the listener to save memory.
		once: function(fn) {
			var called = false;
			return function() {
				if ( called ) return;
				called = true;
				return fn.apply(scope, arguments);
			}
		},

		// always wait for the configured delay.  Useful
		// for arranging to fire after other events and avoiding
		// race conditions.
		delay: function(fn, delay) {
			return function() {
				var args = arguments;
				var me = this;
				setTimeout(function() {
					fn.apply(me, args);
				}, delay)
			}
		},

		// wait for the configured delay before invoking the 
		// handler. If another similar event is fired before
		// then, the old event is thrown away, the new event
		// replaces it, and the countdown starts over.
		// useful for waiting for a situation to calm down
		// before starting a heavy operation.
		collapse: function(fn, delay) {
			var id;
			return function() {
				var args = arguments;
				var me = this;
				clearTimeout(id);
				id = setTimeout(function() {
					fn.apply(me, args);
				}, delay);
			}
		},

		// fire immediately when the event fires, but
		// ignore all other similar events until the delay is over.
		// useful for something like mouse events which fire too often.
		throttle: function(fn, delay) {
			var last;
			return function() {
				var now = new Date;
				if ( last && (now - last) < delay ) return;
				last = now;
				return fn.apply(this, arguments);
			}
		}
	};

	// start with the functional wrapper:
	//   options: scope, once, delay, collapse
	function prepareEventHandler(handler, options) {
		// throw an exception now, rather than later when the event fires.
		if ( typeof callback != 'function' ) {
			throw TypeError("event handler must be a function.");
		}

		if ( options  ) {
			for ( var key in options ) {
				handler = optionHandlers[key](handler, options[key]);
			}
		}

		return handler;
	}

	// TODO
	// The next thing I need is the concept of an Observable Adaptor, classes
	// which wrap other event emitors (DOM nodes, jQuery, Ext.Observerable,
	// EventEmitters, google.maps.events, etc.) to provide a consistent
	// interface. Specific adaptors will be written separately and included on
	// an "as-needed" basis.
	function Adaptor(emitter) {
		this.emitter = emitter;
	}
	Adaptor.prototype = {
		on: function(eventName, handler) {
			// add a listener by delegating to the underlying emitter.
			// note that options are handled first so the adaptors don't 
			// have to know about them.
		},
		on: function(eventName, handler) {
			// delegate removing the listener to the underlying emitter.
		}
		// purge() or destroy() to remove all events?
	};

	function wrap(emitter) {
		// wrap the emitter in an Adaptor and return it. idempotent
	}

	// TODO
	// I'm also going to need my own implementation of Observable, preferably
	// as a mixin which can be added to JavaScript classes

	// TODO The main components are the master binding and unbinding functions,
	// which can take any kind of event emiter for which there's a registered
	// adaptor, an event selector, a handler function, and any number of event
	// options to set up the listeners.
	function on(emitter, eventName, handler, options) { } 
	function un(emitter, eventName, handler) { }

	// TODO
	// I think a binding bundle class would also be handy. Basically, it would
	// keep track of a bunch of events you register and can be destroyed all at
	// once. Binding classes are an excellent way to achieve code re-use in the
	// controller layer, and I'd rather encourage people to using them rather
	// than proving support for something like jQuery namespaced events.
	function Binding(config) {
		for ( var key in config ) this[key] = config[key];
		this.bound = [];  // keep track of all events registered by this binding.
		this.init();
	}
	Binding.prototype = {
		init: function() {
			// set up bindings between objects passed in as config.
		}, 
		on: function(emitter, eventName, handler, options) {
			// keep track of events bound by this Binding object
			// e.g.
			// this.model.on('change', this.view.update);
			// this.view.on('click', this.model.expand);
		},
		un: function(emitter, eventName, handler, options) {
			// ditto, when unbinding
		},
		destroy: function() {
			// unregister all handlers managed by this binding
		}
	};

	return {
		optionHandlers: optionHandlers,
		prepareEventHandler: prepareEventHandler,
		on: on,
		un: un
	}
});
