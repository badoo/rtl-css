#!/usr/bin/env node

/*!
 * Copyright (C) 2014 by Yuriy Nasretdinov
 *
 * See license text in LICENSE file
 */

var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  prog: "proto2json",
  description: require('../package.json').description,
  version: require('../package.json').version,
  addHelp: true
});
parser.addArgument(
  [ '-i', '--input' ],
  {
    action: 'store',
    defaultValue: '-',
    type: 'string',
    help: 'Input proto file. Default: read from stdin.'
  }
);
parser.addArgument(
  [ '-o', '--output' ],
  {
    action: 'store',
    defaultValue: '-',
    help: 'Output file. Default: write to stdout.'
  }
);
parser.addArgument(
  [ '-d', '--direction' ],
  {
    action: 'store',
    defaultValue: 'ltr',
    help: 'Language direction. Default: ltr.'
  }
);
parser.addArgument(
  [ '-c', '--config' ],
  {
    action: 'store',
    defaultValue: 'config.json',
    help: 'Language direction. Default: config.json.'
  }
);
var args = parser.parseArgs();

var fs = require('fs');

var input = fs.readFileSync(args.input).toString();
var config = JSON.parse(fs.readFileSync(args.config).toString());

var rtlCss = require('../');

console.log(input);

console.log(rtlCss.processCss(rtlCss.processConfig(config), args.direction, input));