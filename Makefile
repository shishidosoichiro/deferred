#
# RUN JSHINT & QUNIT TESTS IN PHANTOMJS
#

test:
	./node_modules/.bin/jshint *.js --config .jshintrc
	./node_modules/.bin/jshint tests/unit/*.js --config .jshintrc
	node tests/server.js &
	phantomjs tests/phantom.js "http://localhost:3000/tests"
	kill -9 `cat tests/pid.txt`
	rm tests/pid.txt

