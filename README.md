# Utility for converting CSS files using external rules

[![NPM version][NPMVI]][NPMVURL] [![Build statusS][BSI]][BSURL] [![Code coverage][CSI]][CSURL]

[NPMVI]: https://badge.fury.io/js/rtl-css.png
[NPMVURL]: http://badge.fury.io/js/rtl-css
[BSI]: https://secure.travis-ci.org/badoo/rtl-css.png?branch=master
[BSURL]: http://travis-ci.org/badoo/rtl-css
[CSI]: https://coveralls.io/repos/badoo/rtl-css/badge.png
[CSURL]: https://coveralls.io/r/badoo/rtl-css

-----

An example config.json contains rules for RTL conversion

Usage example: `node bin/rtl-css.js -i ./test/fixtures/input.css -c config.json -d rtl`

Config format:

## properties:

Replacements for property names in format `{ old_name: new_name }`, for example `{ "left": "right" }`

## values:

Replacement patterns in format `property_name: old_value_pattern = new_value_pattern`

Value patterns are defined in format `%i` or using direct value.

For example:

`float: left = right`

This rule will convert `float: left` to `float: right`

Another, more sophisticated example:

`box-shadow: %1 %2 inset = -%1 %2 inset`

This rule will convert `box-shadow: 1px 2px inset` to `box-shadow: -1px 2px inset`

## options:

You can also specify prefixes for properties and suffixes to values that will be ignored. For example, `//` is an IE hack that should be ignored when rules are applied, as well as `\9` in the value end.
