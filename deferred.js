/**
 * deferred - jQuery.Deferred clone
 *
 * Copyright (c) 2013 shishidosoichiro@hotmail.com
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Version:  0.0.1
 *
 */

(function(window) {

	"use strict";

	var Deferred = (function(){
		var State = function(name){
			this.name = name;
			this.fired = false;
			this.procs = [];
		};
		State.prototype = {
			go: function(proc) {
				this.procs.push(proc);
				if ( this.fired ) proc.apply(proc,this.firedArguments);
			}
			,fireWith: function() {
				this.fired = true;
				this.firedArguments = arguments;
				for (var i in this.procs ) {
					this.procs[i].apply(this.procs[i],arguments);
				}
			}
		};
		var Promise = function(dfd){
			this.dfd = dfd;
		};
		Promise.acknowledge = function(obj){
			if (!obj) return false;
			if (obj instanceof Promise) return true;
			if (obj.promise) return true;
			return false;
		};
		Promise.prototype = {
			done: function(proc) {return this.dfd.done(proc);}
			,fail: function(proc) {return this.dfd.fail(proc);}
			,then: function(done, fail) {return this.dfd.then(done, fail);}
		};

		var Class = function(){
			this.resolved = new State("resolved");
			this.rejected = new State("rejected");
			this.pending = new State("pending");
			this.prms = new Promise(this);
			this.st = this.pending;
		};
		Class.defer = function(callback) {
			return function() {
				var dfd = new Deferred();
				var args = arguments;
				setTimeout(function(){
					try {
						dfd.resolveWith(callback.apply(callback, args));
					}
					catch(e) {
						dfd.rejectWith(e);
					}
				}, 0);
				return dfd.promise();
			};
		};
		Class.when = function() {
			var promises = arguments;
			var count = 0;
			var dfd = new Deferred();
			// at first, set promises to done method of each promise for resolving.
			var done = function(){
				count++;
				if (count >= promises.length) dfd.resolve();
			};
			for (var i = 0; i < promises.length; i++) {
				promises[i].done(done);
			}
			// next, set promises to fail method of each promise for rejecting.
			var fail = function(){dfd.reject();};
			for (i = 0; i < promises.length; i++) {
				promises[i].fail(fail);
			}
			return dfd;
		};
		Class.prototype = {
			state: function() {
				return this.st.name;
			}
			,resolve: function() {return this.resolveWith();}
			,resolveWith: function() {
				if ( this.isResolved() ) return this;
				this.st = this.resolved;
				this.st.fireWith.apply(this.st,arguments);
				return this;
			}
			,isResolved: function() {return this.st == this.resolved;}
			,reject: function() {return this.rejectWith();}
			,rejectWith: function() {
				if ( this.isRejected() ) return this;
				this.st = this.rejected;
				this.st.fireWith.apply(this.st,arguments);
				return this;
			}
			,isRejected: function() {return this.st == this.rejected;}
			,done: function(proc) {
				this.resolved.go(proc);
				return this;
			}
			,fail: function(proc) {
				this.rejected.go(proc);
				return this;
			}
			,promise: function() {
				return this.prms;
			}
			,then: function(done, fail) {
				var dfd = new Deferred();
				this.done(function(){
					var result = done.apply(done,arguments);
					if (Promise.acknowledge(result)) {
						result.done(function(res){dfd.resolveWith.apply(dfd,arguments);});
						result.fail(function(){dfd.rejectWith.apply(dfd,arguments);});
					}
					else {
						dfd.resolveWith(result);
					}
				});
				this.fail(function(e){
					if (fail) {
						var result = fail.apply(fail,arguments);
						if (Promise.acknowledge(result)) {
							result.done(function(){dfd.resolveWith.apply(dfd,arguments);});
							result.fail(function(){dfd.rejectWith.apply(dfd,arguments);});
						}
						else {
							dfd.rejectWith(result);
						}
					}
					else {
						dfd.rejectWith.apply(dfd,arguments);
					}
				});
				return dfd.promise();
			}
		};
		return Class;
	})();
	
	window.Deferred = Deferred;
})(window);
