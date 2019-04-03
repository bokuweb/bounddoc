const nodes = require('./nodes');

exports.Element = nodes.Element;
exports.element = nodes.element;
exports.text = nodes.text;
exports.parseXML = require('./reader').parseXML;
