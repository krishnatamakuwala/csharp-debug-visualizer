// Validate user settings
function validateUserSettings(primaryColor)
{
	// #region Primary Color
	let hexColorRegex = /#[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/g;
	return hexColorRegex.test(primaryColor);
	// #endregion
}

// Get custom parsed string
function getCustomParsedString(str) {
	if((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("\"") && str.endsWith("\"")))
	{
		str = str.slice(1, -1);
	}
	return str;
}

module.exports = {
    getCustomParsedString,
	validateUserSettings
}