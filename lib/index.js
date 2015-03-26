(function () {
	var RTL_BEGIN = "/* @rtl begin */";
	var RTL_END = "/* @rtl end */";

	var LTR_BEGIN = "/* @ltr begin */";
	var LTR_END = "/* @ltr end */";

	var NOFLIP_BEGIN = "/* @noflip begin */";
	var NOFLIP_END = "/* @noflip end */";

	var SECTIONS_MARKERS = [
		[NOFLIP_BEGIN, NOFLIP_END],
		[RTL_BEGIN, RTL_END]
	];

	function trim(str) {
		return str.replace(/(^\s+|\s+$)/g, '');
	}

	// parse rules object and form the config that is usable for processing
	function processRTLConfig(config) {
		var values = config.values;
		if (!values) {
			throw new Error("Invalid config: section 'values' is missing or invalid");
		}

		var dynamic = {};
		for (var i = 0; i < values.length; i++) {
			var elem = values[i];
			var elem_parts = elem.split('=', 2);
			var key = elem_parts[0];
			var replace = elem_parts[1];

			var key_parts = key.split(':', 2);
			if (key_parts.length != 2) {
				throw new Error("Invalid config: incorrect 'values' rule: ':' expected in key for " + i);
			}



			var rule = trim(key_parts[0]);
			var pattern_parts = trim(key_parts[1]).split(/\s+/g);

			if (!dynamic[rule]) dynamic[rule] = {};
			if (!dynamic[rule][pattern_parts.length]) dynamic[rule][pattern_parts.length] = [];

			dynamic[rule][pattern_parts.length].push({pattern: pattern_parts, replace: trim(replace)});
		}

		return {dynamic: dynamic, options: config.options, properties: config.properties};
	}

	/*
	 * For LTR we do not need to do any automatic replaces, we just need to get rid of sections between
	 * RTL_BEGIN and RTL_END
	 *
	 * algorithm does not use regular expressions to archieve maximum perfomance
	 */
	function processLTR(contents) {
		var parts = contents.split(RTL_BEGIN);
		var response = [parts[0]];
		for (var i = 1; i < parts.length; i++) {
			var v = parts[i];
			var end_pos = v.indexOf(RTL_END);
			if (end_pos < 0) continue;
			response.push(v.substr(end_pos + RTL_END.length));
		}
		return response.join('').replace(LTR_BEGIN, '').replace(LTR_END, '').replace(NOFLIP_BEGIN, '').replace(NOFLIP_END, '');
	}

	/*
	 * For RTL we need to get rid of sections between LTR_BEGIN and LTR_END and apply flip-replaces.
	 * These replaces must ignore sections between NOFLIP_BEGIN and NOFLIP_END as well as RTL_BEGIN and RTL_END
	 */
	function processCss(config, direction, contents) {
		if (direction == 'ltr') {
			return processLTR(contents);
		}

		var i, j, v, raw_cnt = 0;
		var parts = contents.split(LTR_BEGIN);
		var response_arr = [parts[0]];
		for (i = 1; i < parts.length; i++) {
			v = parts[i];
			var end_pos = v.indexOf(LTR_END);
			if (end_pos < 0) continue;
			response_arr.push(v.substr(end_pos + LTR_END.length));
		}

		/* sections that do not need to be replaced */
		var raw_sections = {
			// key => value
		};

		for (i = 0; i < SECTIONS_MARKERS.length; i++) {
			var m = SECTIONS_MARKERS[i];
			parts = response_arr.join('').split(m[0]);
			response_arr = [parts[0]];
			for (j = 1; j < parts.length; j++) {
				v = parts[j];
				end_pos = v.indexOf(m[1]);
				if (end_pos < 0) continue;
				var raw_v = v.substr(0, end_pos);
				var raw_k = 'raw_' + (raw_cnt++) + ';';
				raw_sections[raw_k] = raw_v;
				response_arr.push(raw_k);
				response_arr.push(v.substr(end_pos + m[1].length));
			}
		}

		var response = processRTL(config, response_arr.join(''));

		for (var from in raw_sections) {
			response = response.replace(from, raw_sections[from]);
		}

		return response;
	}

	function processSimpleRTLRule(value_raw, patterns, value_suffixes) {
		var value = value_raw.replace(/\\s+$/g, '');
		var k, v, i;

		// cut suffix from values

		for (k in value_suffixes) {
			var suffix = value_suffixes[k];
			if (value.indexOf(suffix, value.length - suffix.length) !== -1) {
				value = value.substr(0, -suffix.length);
				value = value.replace(/\\s+$/g, '');
			}
		}

		var len = value.length - value_raw.length;
		var value_suffix = len ? value_raw.substr(len) : '';
		var ltrimmed = value.replace(/^\s+/g, '');

		len = value.length - ltrimmed.length;
		var value_prefix = len ? value.substr(0, len) : '';

		var value_parts = ltrimmed.split(/\s+/g);

		if (!patterns[value_parts.length]) {
			return false;
		}

		var my_patterns = patterns[value_parts.length];

		upper_loop:
			for (k = 0; k < my_patterns.length; k++) {
				var pat = my_patterns[k];
				var m = {}; // match
				for (i = 0; i < pat.pattern.length; i++) {
					v = pat.pattern[i];
					if (v.charAt(0) != '%') {
						if (value_parts[i] !== v) {
							continue upper_loop;
						}
					} else {
						m[v] = value_parts[i];
					}
				}

				var result = pat.replace;
				for (var k_m in m) {
					result = result.replace(k_m, m[k_m]);
				}

				return value_prefix + result.replace('--', '').replace('-0', '0') + value_suffix;
			}

		return false;
	}

	// Process RTL rules for contents
	function processRTL(config, contents) {
		var rules = contents.split(';');
		var response_arr = [];

		var dynamic = config.dynamic;
		var property_rules = config.properties;
		var key_prefixes = config.options.prefix;
		var value_suffixes = config.options.suffix;

		var last_part = rules.pop();
		var rule, value, k, v, i;

		for (i in rules) {
			var part = rules[i];
			var last_brace = part.lastIndexOf('{');
			if (last_brace < 0) {
				rule = part;
			} else {
				response_arr.push(part.substr(0, last_brace + 1));
				rule = part.substr(last_brace + 1);
			}

			// parse "rule: value", ignore other parts
			var rule_parts = rule.split(':', 2);
			var key = rule_parts[0];
			for (k in key_prefixes) {
				key = key.replace(k, key_prefixes[k]);
			}

			if (key.indexOf('/*') >= 0) {
				key = key.replace(/\/\*.*?\*\//g, '', key);
			}

			key = trim(key);

			if (rule_parts.length < 2 || !dynamic[key] && !property_rules[key]) {
				response_arr.push(rule);
				response_arr.push(';');
				continue;
			}

			var key_raw = rule_parts[0], value_raw = rule_parts[1];

			if (property_rules[key]) {
				response_arr.push(key_raw.replace(key, property_rules[key]));
				response_arr.push(':');
				response_arr.push(value_raw);
				response_arr.push(';');
				continue;
			}

			var patterns = dynamic[key];

			if (value_raw.indexOf(',') < 0 && value_raw.indexOf("(") < 0) { // simple rule
				value = processSimpleRTLRule(value_raw, patterns, value_suffixes);
				if (!value) {
					response_arr.push(rule);
					response_arr.push(';');
					continue;
				}
			} else { // complex rule with "(...)" and ","
				var replaced_expressions = {};
				var idx = 0;

				value = value_raw.replace(
					/\([^)]+\)/g,
					function (str) {
						var transform = '_replaced_value_' + (idx++) + '_';
						replaced_expressions[transform] = str;
						return transform;
					}
				);

				console.log("After replacement: '%s'", value);

				var value_components = value.split(',');
				for (k = 0; k < value_components.length; k++) {
					v = processSimpleRTLRule(value_components[k], patterns, value_suffixes);
					if (v) {
						value_components[k] = v;
					}
				}

				value = value_components.join(',');
				for (k in replaced_expressions) {
					value = value.replace(k, replaced_expressions[k]);
				}
			}

			response_arr.push(key_raw);
			response_arr.push(':');
			response_arr.push(value);
			response_arr.push(';');
		}

		response_arr.push(last_part);

		return response_arr.join('');
	}

	exports.processConfig = processRTLConfig;
	exports.processCss = processCss;
})();
