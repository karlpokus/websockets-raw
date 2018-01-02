module.exports = function parseOpcode(data) {
	const bin = (data[0]).toString(2).substr(4);
	return parseInt(bin, 2);
}
