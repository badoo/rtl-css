all: npm-install

npm-install: node_modules/npm-install-stamp

node_modules/npm-install-stamp:
	npm install
	touch ./node_modules/npm-install-stamp

clean:
	rm -rf ./node_modules

test: npm-install
	./node_modules/.bin/mocha test/test.js -R spec

test-coveralls: npm-install
	rm -rf ./lib-cov && ./node_modules/.bin/jscoverage lib lib-cov
	LIB_COV=1 ./node_modules/.bin/mocha test/test.js -R mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

lint: npm-install
	./node_modules/.bin/jshint . --show-non-errors

.PHONY: all npm-install clean test test-coveralls
