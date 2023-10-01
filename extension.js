// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('csharp-debug-visualizer.visualize', async function () {
		// The code you place here will be executed every time your command is executed

		// Get access to editor
		const editor = vscode.window.activeTextEditor;
		if(!editor)
		{
			vscode.window.showInformationMessage("Editor does not exist");
			return;
		}

		const selectedVariable = editor.document.getText(editor.selection);

		try{
			// Get Active Debug Session
			const session = vscode.debug.activeDebugSession;

			// Get Thread
			const threadResponse = await session.customRequest('threads');
			const threadId = threadResponse.threads[0].id;

			// Get StackFrame
			const stackResponse = await session.customRequest('stackTrace', { threadId: threadId, startFrame: 0 });
			const frameId = stackResponse.stackFrames[0].id;

			// Get Scope
			const scopeResponse = await session.customRequest('scopes', { frameId: frameId });
			const variableReference = scopeResponse.scopes[0].variablesReference;

			// Get Variable
			const variableResponse = await session.customRequest('variables', { variablesReference: variableReference });
			const variables = variableResponse.variables;
			
			// Get type of variable
			const variableTypeResponse = await session.customRequest('evaluate', { expression: `${selectedVariable}.GetType().FullName`, frameId: frameId });
			const variableType = getCustomParsedString(variableTypeResponse.result);
			
			switch (variableType) {
				case "System.Char":
				case "System.String":
				case "System.Int16":
				case "System.Int32":
				case "System.Int64":
				case "System.UInt16":
				case "System.UInt32":
				case "System.UInt64":
				case "System.Double":
				case "System.Single":
				case "System.Boolean":
				case "System.Decimal":
				case "System.Byte":
				case "System.SByte":
				case "System.Object":
					var result = variables.filter(x => x.evaluateName == selectedVariable)[0].value;
					break;
				case "System.Char[]":
				case "System.String[]":
				case "System.Int16[]":
				case "System.Int32[]":
				case "System.Int64[]":
				case "System.UInt16[]":
				case "System.UInt32[]":
				case "System.UInt64[]":
				case "System.Double[]":
				case "System.Single[]":
				case "System.Boolean[]":
				case "System.Decimal[]":
				case "System.Byte[]":
				case "System.SByte[]":
				case "System.Object[]":
					var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
					var result = await session.customRequest('variables', { variablesReference: varRef });
					result = result.variables.map(x => { return x.value });
					result = result.toString();
					break;
				case "System.Data.DataColumn":
					var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
					var dataColumnRes = await session.customRequest('variables', { variablesReference: varRef });
					var result = dataColumnRes.variables.filter(x => x.name.includes('ColumnName'))[0].value;
					break;
				case "System.Data.DataRow":
					var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
					var dataRowRes = await session.customRequest('variables', { variablesReference: varRef });
					var rowsItemVariableRef = dataRowRes.variables.filter(x => x.name.includes('ItemArray'))[0].variablesReference;
					var rowItemRes = await session.customRequest('variables', { variablesReference: rowsItemVariableRef });
					var result = rowItemRes.variables.map(x => { return x.value });
					result = result.toString();
					break;
				case "System.Data.DataTable":
					var result = await getDataTableInformation(session, selectedVariable, variableResponse.variables.filter(x => x.evaluateName == selectedVariable));
					break;
				default:
					if(variableType.includes("System.Collections.Generic.List"))
					{
						var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
						var result = await session.customRequest('variables', { variablesReference: varRef });
						result = result.variables.filter(x => !x.name.includes('Raw View')).map(x => { return x.value });
						result = result.toString();
					}
					else if(variableType.includes("AnonymousType"))
					{
						var result = variables.filter(x => x.evaluateName == selectedVariable)[0].value;
					}
					else if(variableType.includes("Newtonsoft.Json.Linq.JObject"))
					{
						var result = variables.filter(x => x.evaluateName == selectedVariable)[0].value;
						result = getCustomParsedString(result);
					}
					else if(variableType.toLowerCase().includes("error".toLowerCase()))
					{
						var errorMessage = variableType;
						throw new Error(errorMessage);
					}
					else
					{
						var result = "Oops...Not supported variable, still in development soooo...stay connected!!!";
					}
					break;
			}

			// Create web view panel to display result
			const panel = vscode.window.createWebviewPanel(
				'get-selected-text',
				'Visualize',
				vscode.ViewColumn.Two,
				{
					enableScripts: true
				}
			);
			panel.webview.html = getWebviewContent(selectedVariable, result, variableType);
		}
		catch(error) {
			vscode.window.showErrorMessage(error.message);
		}
	});

	context.subscriptions.push(disposable);
}

// #region Get html for Web View
function getWebviewContent(selectedVariable, result, variableType) {
	let finalWebContent = '';
	let preWebContent = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	  	<meta charset="UTF-8">
	  	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	  	<title>Visualize</title>
		<script src="https://kit.fontawesome.com/e23b471cdb.js" crossorigin="anonymous"></script>
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600&family=Roboto+Mono&display=swap');
			
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
				background-color: #454754;
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
				background-color: #383b45;
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
				background-color: #fff;
				color: #555;
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
				background-color: #454754;
				color: white;
			}
		</style>
	</head>
	<body>
		<div id="main-container" class="main-container">`

	// Conditional functionalities
	if (variableType != "System.Data.DataTable")
	{
		preWebContent += `
			<div id="function-container" class="function-container">
				<button id="btn-copyToClipBoard" onclick="copyToClipBoard()">
					<i class="fa-regular fa-clipboard" style="color: #ffffff;"></i>
					<span class="tooltiptext">Copy To Clipboard</span>
				</button>
				<button id="btn-wordWrap" onclick="wordWrap()">
					<i class="fa-solid fa-indent" style="color: #ffffff;"></i>
					<span class="tooltiptext">Word Wrap</span>
				</button>
			</div>`;
	}
	else
	{
		preWebContent += `
			<div id="function-container" class="function-container">
				<button id="btn-saveAsCSV" onclick="saveAsCSV()">
					<i class="fa-solid fa-download" style="color: #ffffff;"></i>
					<span class="tooltiptext">Save As CSV</span>
				</button>
			</div>`;		
	}

	let resultWebContent = '';

	switch (variableType) {
		case "System.Char":
		case "System.String":
		case "System.Int16":
		case "System.Int32":
		case "System.Int64":
		case "System.UInt16":
		case "System.UInt32":
		case "System.UInt64":
		case "System.Double":
		case "System.Single":
		case "System.Boolean":
		case "System.Decimal":
		case "System.Byte":
		case "System.SByte":
		case "System.Object":
		case "System.Data.DataColumn":
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>${result}</code></p>
				</div>
			`;
			break;
		case "System.Char[]":
		case "System.String[]":
		case "System.Int16[]":
		case "System.Int32[]":
		case "System.Int64[]":
		case "System.UInt16[]":
		case "System.UInt32[]":
		case "System.UInt64[]":
		case "System.Double[]":
		case "System.Single[]":
		case "System.Boolean[]":
		case "System.Decimal[]":
		case "System.Byte[]":
		case "System.SByte[]":
		case "System.Object[]":
		case "System.Data.DataRow":
			resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${selectedVariable} : <code>[ ${result.replace(/,/g, ", ")} ]</code></p>
				</div>
			`;
			break;
		case "System.Data.DataTable":
			resultWebContent = `
				<div>
					<h3>Variable Name : ${selectedVariable}</h3>
					<p>Column Count : ${result.Columns.Count}</p>
					<p>Row Count : ${result.Rows.Count}</p>
					<table id="datatable">
						<thead>
							<tr>
								<th>Sr. No.</th>`;
			result.Columns.List.forEach(column => {
				let columnString = '<th>' + getCustomParsedString(column) + '</th>';
				resultWebContent += columnString;
			});
			resultWebContent += `
							</tr>
						</thead>
						<tbody>
			`;

			let i = 1;
			result.Rows.List.forEach(row => {
				resultWebContent += '<tr>';
				resultWebContent += `<td>${i}.</td>`;
				row.forEach(rowData => {
					let rowDataString = '<td>' + getCustomParsedString(rowData) + '</td>';
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
				</div>
			`
			break;
		default:
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
			else
			{
				resultWebContent = `
				<div id="result-container" class="result-container">
					<p>${result}</p>
				</div>
				`;
			}
			break;
	}

	let messageWebContent = `
			<div class="popup">
				<span class="popup-message" id="popup-message"></span>
			</div>
		</div>
		`;
		
	let scriptWebContent = `
		<script>`;

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
			function saveAsCSV()
			{
				var popup = document.getElementById("popup-message");
				var message = "Saved";
				var csvData = '';
				csvData += '${result.Columns.List.map(x => { return getCustomParsedString(x); }).toString()}\\n';`;

		result.Rows.List.forEach(rows => {
			scriptWebContent += `
				csvData += '${rows.toString()}\\n';
			`
		});

		console.log(scriptWebContent);

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
// #endregion

// #region Common methods or functions
// Get Datatable information
async function getDataTableInformation(session, selectedVariable, variable)
{
	try
	{
		const res = {};
		res.name = selectedVariable;

		const dtRef = variable[0].variablesReference;
		const resForDt = await session.customRequest('variables', { variablesReference: dtRef });

		res.Columns = {};
		const columnRef = resForDt.variables.filter(x => x.evaluateName == 'dataTable.Columns')[0].variablesReference;
		const resForColumn = await session.customRequest('variables', { variablesReference: columnRef });
		res.Columns.Count = resForColumn.variables.filter(x => x.evaluateName == 'dataTable.Columns.Count')[0].value;
		const resForColumnList = await session.customRequest('variables', { variablesReference: resForColumn.variables.filter(x => x.evaluateName == 'dataTable.Columns.List')[0].variablesReference });
		res.Columns.List = resForColumnList.variables.filter(x => x.name != 'Raw View').map(x => { return x.value });

		res.Rows = {};
		const rowRef = resForDt.variables.filter(x => x.evaluateName == 'dataTable.Rows')[0].variablesReference;
		const resForRow = await session.customRequest('variables', { variablesReference: rowRef });
		res.Rows.Count = resForRow.variables.filter(x => x.evaluateName == 'dataTable.Rows.Count')[0].value;
		const resForRowList = await session.customRequest('variables', { variablesReference: resForRow.variables.filter(x => x.evaluateName == 'dataTable.Rows, results')[0].variablesReference });

		var rows = [];

		await Promise.all(resForRowList.variables.map(async (rowVariable) => {
			var row = await session.customRequest('variables', { variablesReference: rowVariable.variablesReference });
			rows.push(row);
		}));

		const rowsItemVariableRef = rows.map(row => { return row.variables }).map(row => { return row.filter(x => x.name.includes('ItemArray'))[0].variablesReference });

		var rowItemArray = [];

		await Promise.all(rowsItemVariableRef.map(async (rowItem) => {
			var rowItem = await session.customRequest('variables', { variablesReference: rowItem });
			rowItemArray.push(rowItem);
		}));

		res.Rows.List = rowItemArray.map(row => { return row.variables.map(rowItem => { return rowItem.value }) });

		return res;
	}
	catch(error) {
		return error;
	}
}

// Get custom parsed string
function getCustomParsedString(str) {
	if((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("\"") && str.endsWith("\"")))
	{
		str = str.slice(1, -1);
	}
	return str;
}
// #endregion

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}