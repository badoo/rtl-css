/*!
 * Copyright (C) 2015 by Yuriy Nasretdinov
 *
 * See license text in LICENSE file
 */

/*global describe, it*/

"use strict";

var assert = require("assert");
var fs = require("fs");

var rtlCss = require('../');

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
});