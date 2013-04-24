$(function () {

		module("deferred")

			function delayResolve(msec, state)
			{
				var d = new Deferred();
				setTimeout(function(){
					state.name = 'resolved';
					d.resolveWith('Success!!');
				}, msec);
				return d.promise();
			}

			function delayReject(msec, state) {
				var d = new Deferred();
				setTimeout(function(){
					state.name = 'rejected';
					d.rejectWith('Error!!');
				}, msec);
				return d.promise();
			}

			function delay(msec, callback)
			{
				var d = new Deferred();
				return function() {
					var args = arguments;
					setTimeout(function(){
						try {
							d.resolveWith(callback.apply(callback, args));
						} catch(e){
							console.log(e);
						}
					}, msec);
					return d.promise();
				};
			}

			test("should provide done if resolved", 3, function () {
				var state = {name:'pending'};
				var promise = delayResolve(500, state);
				promise.done(function(data){
					equal(state.name, 'resolved', 'deferred was resolved');
					equal(data, 'Success!!', 'deferred was resolved');
					start();
				});
				promise.fail(function(){
					ok(false, 'deferred was resolved');
					start();
				});
				equal(state.name, 'pending', 'deferred is still pending');
				stop();
			})

			test("should provide fail if rejected", 3, function () {
				var state = {name:'pending'};
				var promise = delayReject(500, state);
				promise.done(function(){
					ok(false, 'deferred was rejected');
					start();
				});
				promise.fail(function(e){
					equal(state.name, 'rejected', 'deferred was resolved');
					equal(e, 'Error!!', 'deferred was rejected');
					start();
				});
				equal(state.name, 'pending', 'deferred is still pending');
				stop();
			})

			test("should provide done in 'then' method if resolved", 1, function () {
				var state = {name:'pending'};
				var promise = delayResolve(500, {});
				promise.then(function(){
					ok(true, 'deferred was resolved');
					start();
				}, function(){
					ok(false, 'deferred was resolved');
					start();
				});
				stop();
			})

			test("should provide fail in 'then' method if rejected", 1, function () {
				var promise = delayReject(500, {});
				promise.then(function(){
					ok(false, 'deferred was rejected');
					start();
				}, function(){
					ok(true, 'deferred was rejected');
					start();
				});
				stop();
			})

			test("should ensure the order of callbacks by promise", 4, function () {
				var count = -1;
				function log(text){
					count++;
					/*
					console.log('count: $count time: $time text:$text'
					.replace('$count', count)
					.replace('$time', new Date())
					.replace('$text', text));
					*/
				}
				log('start');
				delay(500, function(){
					log('1');
				})()
				.then(delay(300, function(){
					log('2');
					equal(count, 2, '2nd callback is done');
					return '2nd result';
				}))
				.then(delay(200, function(res){
					log('3');
					equal(count, 3, '3rd callback is done');
					equal(res, '2nd result', '3rd callback receive return value of 2nd callback');
				}))
				.then(delay(100, function(){
					log('4');
					equal(count, 4, '4th callback is done');
					start();
				}));
				stop();
			})

			test("should ensure the order of callbacks", 4, function () {
				var count = 0;
				delay(500, function(){
					count++;
				})()
				.then(function(){
					count++;
					equal(count, 2, '2nd callback is done');
					return '2nd result';
				})
				.then(function(res){
					count++;
					equal(count, 3, '3rd callback is done');
					equal(res, '2nd result', '3rd callback receive return value of 2nd callback');
				})
				.then(function(){
					count++;
					equal(count, 4, '4th callback is done');
					start();
				});
				stop();
			})

			test("should skip callbacks if failed", 1, function () {
				delayReject(500, {})
				.then(function(){
					ok(false, '2nd callback is skipped');
				})
				.then(function(){
					ok(false, '3rd callback is skipped');
				})
				.then(function(){
					ok(false, '4th callback is skipped');
					start();
				})
				.fail(function(e){
					equal(e, 'Error!!', 'it caught error');
					start();
				});
				stop();
			})

			test("should resume from failure", 1, function () {
				delayReject(500, {})
				.then(function(){
					ok(false, '2nd callback is skipped');
				}, function (e){
					return new Deferred().resolve().promise();
				})
				.then(function(){
					ok(true, 'resume');
					start();
				});
				stop();
			})

			test("should resume from failure", 1, function () {
				delayReject(500, {})
				.then(function(){
					ok(false, '2nd callback is skipped');
				}, function (e){
					return new Deferred().reject().promise();
				})
				.then(function(){
					ok(false, 'not resume');
					start();
				})
				.fail(function(){
					ok(true, 'not resume');
					start();
				});
				stop();
			})

			test("should not resume from failure if rejected", 1, function () {
				delayReject(500, {})
				.then(function(){
					ok(false, '2nd callback is skipped');
				}, function (e){
					return new Deferred().reject().promise();
				})
				.then(function(){
					ok(false, 'not resume');
					start();
				})
				.fail(function(){
					ok(true, 'not resume');
					start();
				});
				stop();
			})

			test("'when' should execute last process after all parallel processes is done", 6, function () {
				var count = 0;
				var delay100 = delay(100, function(){
					count++;
					equal(count, 1, 'this proc is finished at 1st.');
				});
				var delay200 = delay(200, function(){
					count++;
					equal(count, 2, 'this proc is finished at 2nd.');
				});
				var delay300 = delay(300, function(){
					count++;
					equal(count, 3, 'this proc is finished at 3rd.');
				});
				var delay400 = delay(400, function(){
					count++;
					equal(count, 4, 'this proc is finished at 4th.');
				});
				var delay500 = delay(500, function(){
					count++;
					equal(count, 5, 'this proc is finished at 5th.');
				});
				Deferred.when(delay400(), delay500(),delay100(),delay300(),delay200())
				.done(function(){
					count++;
					equal(count, 6, 'this proc is finished at 6th.');
					start();
				});
				stop();
			})

			test("'when' should execute last process after all parallel processes is done", 3, function () {
				var count = 0;
				var delay100 = delay(100, function(){
					count++;
					equal(count, 1, 'this proc is finished at 1st.');
				});
				var delay200 = delay(200, function(){
					count++;
					equal(count, 2, 'this proc is finished at 2nd.');
				});
				var delay400 = delay(400, function(){
					count++;
					equal(count, 4, 'this proc is finished at 4th.');
				});
				var delay500 = delay(500, function(){
					count++;
					equal(count, 5, 'this proc is finished at 5th.');
				});
				Deferred.when(delay400(), delay500(),delay100(),delayReject(300, {}),delay200())
				.done(function(){
					ok(false, 'this proc is not executed.');
					start();
				})
				.fail(function(){
					count++;
					equal(count, 3, 'this proc is finished at 3rd.');
					start();
				});
				stop();
			})

			test("should provide 'promise' interface to a normal function", 2, function () {
				var loop1000 = function(data) {
					data.count = data.start;
					for (var i = 0; i < 1000; i++) {
						data.count = data.count + i;
					}
					return data.count;
				};
				var delayLoop1000 = Deferred.defer(loop1000);
				var data = {count: 1, start:10};
				delayLoop1000(data)
				.done(function(count){
					equal(count, 499510, 'calc is done');
					start();
				});
				ok(data.count != 499510, 'not calc.');
				stop();
			})

})