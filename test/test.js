/*!
 * Copyright (C) 2015 by Yuriy Nasretdinov
 *
 * See license text in LICENSE file
 */

/*global describe, it*/

"use strict";

var assert = require("assert");
var fs = require("fs");

var rtlCss = require(process.env.LIB_COV ? '../lib-cov' : '../');

var config = rtlCss.processConfig(JSON.parse(fs.readFileSync("config.json").toString()));
var input = fs.readFileSync("test/fixtures/input.css").toString();
var output_ltr = fs.readFileSync("test/fixtures/output-ltr.css").toString();
var output_rtl = fs.readFileSync("test/fixtures/output-rtl.css").toString();

describe("rlt-css", function () {
	it("should properly convert file to ltr version", function () {
		assert.equal(output_ltr, rtlCss.processCss(config, 'ltr', input));
	});

	it("should properly convert file to rtl version", function () {
		assert.equal(output_rtl, rtlCss.processCss(config, 'rtl', input));
	});

	describe("config", function () {
		it("should contains 'properties' section", function () {
			assert.throws(
				function () {
					rtlCss.processConfig({values: {}});
				},
				Error,
				"section 'properties' is missing"
			);
		});

		it("should contains 'values' section", function () {
			assert.throws(
				function () {
					rtlCss.processConfig({properties: {}});
				},
				Error,
				"section 'values' is missing"
			);
		});

		it("should contains valid 'values' section", function () {
			assert.throws(
				function () {
					rtlCss.processConfig({
						properties: {},
						values: [
							"direction ltr = rtl"
						]
					});
				},
				Error,
				"incorrect 'values' rule"
			);
		});
	});
});
