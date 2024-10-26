const utilities = require('./utilities');

function getWebViewContent(primaryColor, selectedVariable, result, variableType, currentPage, totalPage) {
	let finalWebContent = '';
	let preWebContent = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	  	<meta charset="UTF-8">
	  	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	  	<title>Visualize</title>
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600&family=Roboto+Mono&display=swap');
			
			.loader-container {
				position: absolute;
				display: flex;
				justify-content: center;
				align-items: center;
				width: 100%;
				height: auto;
			}

			.loader {
				position: relative;
				z-index: 1;
				top: 200px;
				width: 32px;
				height: 32px;
				border: 6px solid #b5b5b5;
				border-radius: 50%;
				border-top: 6px solid #f3f3f3;
				-webkit-animation: spin 1.5s linear infinite;
				animation: spin 1.5s linear infinite;
			}
			  
			@-webkit-keyframes spin {
				0% { -webkit-transform: rotate(0deg); }
				100% { -webkit-transform: rotate(360deg); }
			}
			  
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}

			.main-container {
				display: flex;
				flex-direction: column;
				font-family: 'Roboto Mono', monospace;
				height: auto;
				width: 100%;
			}

			.function-container {
				width: 100%;
				height: 40px;
			}

			button {
				position: relative;
				font-family: 'Roboto Mono', monospace;
				float: right;
				margin: 10px;
				display: inline-block;
				outline: 0;
				cursor: pointer;
				padding: 5px 16px;
				line-height: 20px;
				vertical-align: middle;
				border: 1px solid;
				border-radius: 6px;
				color: #fff;
				background-color: ${primaryColor};
				border-color: #1b1f2326;
				box-shadow: rgba(27, 31, 35, 0.04) 0px 1px 0px 0px, rgba(255, 255, 255, 0.25) 0px 1px 0px 0px inset;
				transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
				transition-property: color, background-color, border-color;
			}

			#btn-copyToClipBoard {
				position: fixed;
				right: 25px;
			}

			#btn-wordWrap {
				position: fixed;
				right: 80px;
			}

			#btn-saveAsCSV {
				position: fixed;
				right: 25px;
			}

			button:hover {
				filter: brightness(.75);
				border-color: #1b1f2326;
				transition-duration: 0.1s;
			}

			button .tooltiptext {
				visibility: hidden;
				width: 100px;
				background-color: #383b45;
				color: #fff;
				text-align: center;
				border-radius: 6px;
				padding: 5px 0;
				position: absolute;
				z-index: 1;
				top: 125%;
				left: 50%;
				margin-left: -50px;
				opacity: 0;
				transition: opacity 0.3s;
			}
			  
			button .tooltiptext::after {
				content: "";
				position: absolute;
				bottom: 100%;
				left: 50%;
				margin-left: -5px;
				border-width: 5px;
				border-style: solid;
				border-color: transparent transparent #383b45 transparent;
			}
			  
			button:hover .tooltiptext {
				visibility: visible;
				opacity: 1;
			}

			.ddlPages {
				background-color: ${primaryColor};
				color: white;
				border: 1px solid #e6e6e6;
				border-radius: 10%;
				text-align: center;
			}

			.popup {
				position: relative;
				display: inline-block;
				cursor: pointer;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
			}

			.popup .popup-message {
				visibility: hidden;
				width: 160px;
				background-color: ${primaryColor};
				color: white;
				text-align: center;
				border-radius: 6px;
				padding: 8px 0;
				position: absolute;
				z-index: 1;
				top: 90%;
				left: 50%;
				margin-left: -80px;
			}

			.popup .show {
				visibility: visible;
				-webkit-animation: fadeIn 0.5s;
				animation: fadeIn 0.5s;
			}

			.popup .hide {
				visibility: hidden;
				-webkit-animation: fadeOut 0.5s;
				animation: fadeOut 0.5s;
			}

			@-webkit-keyframes fadeIn {
				from {opacity: 0;} 
				to {opacity: 1;}
			}

			@keyframes fadeIn {
				from {opacity: 0;}
				to {opacity: 1;}
			}

			@-webkit-keyframes fadeOut {
				from {opacity: 1;} 
				to {opacity: 0;}
			}

			@keyframes fadeOut {
				from {opacity: 1;}
				to {opacity: 0;}
			}

			code, p {
				font-family: 'Roboto Mono', monospace;
				white-space: pre;
			}

			#datatable {
				border-collapse: collapse;
				width: 100%;
			}
			  
			#datatable td, #datatable th {
				border: 1px solid #e6e6e6;
				padding: 8px;
			}
			  
			#datatable th {
				padding-top: 12px;
				padding-bottom: 12px;
				text-align: left;
				background-color: ${primaryColor};
				color: white;
			}
		</style>
	</head>
	<body onload="stopLoader()">
		<div id="loader-container" class="loader-container">
			<div id="loader" class="loader"></div>
		</div>
		<div id="main-container" class="main-container">`

	// Conditional functionalities
	if (variableType != "System.Data.DataTable")
	{
		preWebContent += `
			<div id="function-container" class="function-container">
				<button id="btn-copyToClipBoard" onclick="copyToClipBoard()">
					<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512" style="fill: #ffffff;">
						<path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/>
					</svg>
					<span class="tooltiptext">Copy To Clipboard</span>
				</button>
				<button id="btn-wordWrap" onclick="wordWrap()">
					<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512" style="fill: #ffffff;">
						<path d="M0 64C0 46.3 14.3 32 32 32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64zM192 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32zm32 96H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32zM0 448c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM127.8 268.6L25.8 347.9C15.3 356.1 0 348.6 0 335.3V176.7c0-13.3 15.3-20.8 25.8-12.6l101.9 79.3c8.2 6.4 8.2 18.9 0 25.3z"/>
					</svg>
					<span class="tooltiptext">Word Wrap</span>
				</button>
			</div>`;
	}
	else
	{
		preWebContent += `
			<div id="function-container" class="function-container">
				<button id="btn-saveAsCSV" onclick="saveAsCSV()">
					<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="fill: #ffffff;">
						<path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/>
					</svg>
					<span class="tooltiptext">Save As CSV</span>
				</button>
			</div>`;		
	}

	let resultWebContent = '';

	const singleVariableType = ["System.Char", "System.String", "System.Int16", "System.Int32", "System.Int64", "System.UInt16", "System.UInt32", "System.UInt64", "System.Double", "System.Single", "System.Boolean", "System.Decimal", "System.Byte", "System.SByte", "System.Object", "System.Data.DataColumn", "System.Text.StringBuilder"];

	const arrayVariableType = ["System.Char[]", "System.String[]", "System.Int16[]", "System.Int32[]", "System.Int64[]", "System.UInt16[]", "System.UInt32[]", "System.UInt64[]", "System.Double[]", "System.Single[]", "System.Boolean[]", "System.Decimal[]", "System.Byte[]", "System.SByte[]", "System.Object[]", "System.Data.DataRow", "System.Text.StringBuilder[]"];

	if(singleVariableType.includes(variableType))
	{
		resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>${result}</code></p>
				</div>
		`;
	}
	else if(arrayVariableType.includes(variableType))
	{
		resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>[ ${result.replace(/,/g, ", ")} ]</code></p>
				</div>
		`;
	}
	else if(variableType == "System.Data.DataTable")
	{
		if (result.Columns.Count == 0) {
			resultWebContent = `
				<div>
					Datatable is empty, could not found columns or rows data.
				</div>
			`;
		} else {
			resultWebContent = `
				<div>
					<h3>Variable Name : ${selectedVariable}</h3>
					<p>Column Count : ${result.Columns.Count}</p>
					<p>Row Count : ${result.Rows.Count}</p>
					<p>Total Page : ${totalPage}</p>
					<div style="display: flex;">
						<p style="margin-top: 0px">Current Page : </p>
						<select id="ddlPages" class="ddlPages" onchange="getPaginatedData(this)" style="margin-bottom: 10px;">`;
			for(var page = 1; page <= totalPage; page++)
			{
				let optionString = `<option value="${page}">${page}</option>`;
				resultWebContent += optionString;
			}
			resultWebContent +=	`
						</select>
						<p style="margin-top: 0px"><i> (Record per page : 25)</i></p>
					</div>
					<table id="datatable">
						<thead>
							<tr>
								<th>Sr. No.</th>`;
			result.Columns.List.forEach(column => {
				let columnString = '<th>' + utilities.getCustomParsedString(column) + '</th>';
				resultWebContent += columnString;
			});
			resultWebContent += `
							</tr>
						</thead>
						<tbody>
			`;

			if (result.Rows.Count === 0) {
				let i = ((currentPage - 1) * 25) + 1;
				result.Rows.List.forEach(row => {
					resultWebContent += '<tr>';
					resultWebContent += `<td>${i}.</td>`;
					row.forEach(rowData => {
						let rowDataString = '<td>' + utilities.getCustomParsedString(rowData) + '</td>';
						resultWebContent += rowDataString;
					});
					resultWebContent += '</tr>';
					i++;
				});

				resultWebContent += `
						</tbody>
					</table>
					</br></br>
					<i>> Note: Sr. No. is a Serial Number and it is not included in datatable. It is only provided for better readability!</i>
				`;
			} else {
				resultWebContent += `
						<tbody>
							<td colspan=${result.Columns.Count + 1}>There are no records.</td>
						</tbody>
					</table>
					</br></br>
				`;
			}
			resultWebContent += `
				</div>
			`;
		}
	}
	else
	{
		if(variableType.includes("System.Collections.Generic.List"))
		{
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>[ ${result.replace(/,/g, ", ")} ]</code></p>
				</div>
			`;
		}
		else if(variableType.includes("AnonymousType") || variableType.includes("Newtonsoft.Json.Linq.JObject"))
		{
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>${result}</code></p>
				</div>
			`;
		}
		else if(variableType.includes("System.NullReferenceException"))
		{
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>${result}</code></p>
				</div>
			`;
		}
		else
		{
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p><code style="color: #9fa6b2;">${result}</code></p>
				</div>
			`;
		}
	}

	let messageWebContent = `
			<div class="popup">
				<span class="popup-message" id="popup-message"></span>
			</div>
		</div>
		`;
		
	let scriptWebContent = `
		<script>
			function stopLoader()
			{
				document.getElementById("loader").style.display = "none";
				document.getElementById("main-container").style.webkitFilter = "none";
			}
			
			function startLoader()
			{
				document.getElementById("loader").style.display = "block";
				document.getElementById("main-container").style.webkitFilter = "blur(5px)";
			}`;

	// Conditional scripts
	if (variableType != "System.Data.DataTable")
	{
		scriptWebContent +=	`
			let wrapState = 'off';

			function copyToClipBoard()
			{
				var result = document.getElementsByTagName("code")[0].innerHTML;
				var popup = document.getElementById("popup-message");
				var message = "Copied";

				navigator.clipboard.writeText(result);

				handlePopupMessage(popup, message);
			}

			function wordWrap()
			{
				var element = document.getElementsByTagName("code")[0];
				if(wrapState == 'off')
				{
					element.style.whiteSpace = 'pre-wrap';
                    wrapState = 'on';
				}
				else
				{
					element.style.whiteSpace = 'pre';
                    wrapState = 'off';
				}
			}`;
	}
	else
	{
		scriptWebContent +=	`
			var ddlPages = document.getElementById("ddlPages");
			ddlPages.value = ${currentPage};

			function getPaginatedData(currentPage)
			{
				startLoader();
				const vscode = acquireVsCodeApi();
				vscode.postMessage({
					command: 'getPaginatedData',
					text: currentPage.value
				});
			}

			function saveAsCSV()
			{
				var popup = document.getElementById("popup-message");
				var message = "Saved";
				var csvData = '';
		`;

		if (result.Columns.Count !== 0) {
			scriptWebContent += `
				csvData += '${result.Columns.List.map(x => { return utilities.getCustomParsedString(x); }).toString()}\\n';
			`;

			if (result.Rows.Count === 0) {
				result.Rows.List.forEach(rows => {
					scriptWebContent += `
						csvData += '${rows.toString()}\\n';
					`
				});
			}
	
			scriptWebContent +=	`
					// Download the CSV file
					let anchor = document.createElement('a');
					anchor.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData);
					anchor.target = '_blank';
					anchor.download = 'DataTable.csv';
					anchor.click();
					
					handlePopupMessage(popup, message);
				}
			`
		} else {
			scriptWebContent += `
					handlePopupMessage(popup, "DataTable is empty.");
				}
			`;
		}
	}

	scriptWebContent += `
			function handlePopupMessage(popup, message)
			{
				var delayInMilliseconds = 2000;
				popup.innerHTML = message;

				popup.classList.remove("hide");
				popup.classList.add("show");

				setTimeout(function() {
					popup.classList.remove("add");
					popup.classList.add("hide");
				}, delayInMilliseconds);
			}
		</script>
	`;

	let postWebContent = `
	</body>
	</html>`;

	finalWebContent = preWebContent + resultWebContent + messageWebContent + scriptWebContent + postWebContent;

	return finalWebContent;
}

module.exports = {
    getWebViewContent
}