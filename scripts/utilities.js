// Get custom parsed string
function getCustomParsedString(str) {
	if((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("\"") && str.endsWith("\"")))
	{
		str = str.slice(1, -1);
	}
	return str;
}

module.exports = {
    getCustomParsedString
}