// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const webViewContent = require('./scripts/webViewContent');
const utilities = require('./scripts/utilities');

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

		const selectedVariable = getSelectedVariable(editor);

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
			const variableType = utilities.getCustomParsedString(variableTypeResponse.result);

			const singleVariableType = ["System.Char", "System.String", "System.Int16", "System.Int32", "System.Int64", "System.UInt16", "System.UInt32", "System.UInt64", "System.Double", "System.Single", "System.Boolean", "System.Decimal", "System.Byte", "System.SByte", "System.Object", "System.Text.StringBuilder"];

			const arrayVariableType = ["System.Char[]", "System.String[]", "System.Int16[]", "System.Int32[]", "System.Int64[]", "System.UInt16[]", "System.UInt32[]", "System.UInt64[]", "System.Double[]", "System.Single[]", "System.Boolean[]", "System.Decimal[]", "System.Byte[]", "System.SByte[]", "System.Object[]", "System.Text.StringBuilder[]"];
			
			// Process result for different datatypes
			if (singleVariableType.includes(variableType))
			{
				var result = variables.filter(x => x.evaluateName == selectedVariable)[0].value;
			}
			else if (arrayVariableType.includes(variableType))
			{
				var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
				var result = await session.customRequest('variables', { variablesReference: varRef });
				result = result.variables.map(x => { return x.value });
				result = result.toString();
			}
			else if (variableType == "System.Data.DataColumn")
			{
				var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
				var dataColumnRes = await session.customRequest('variables', { variablesReference: varRef });
				var result = dataColumnRes.variables.filter(x => x.name.includes('ColumnName'))[0].value;
			}
			else if (variableType == "System.Data.DataRow")
			{
				var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
				var dataRowRes = await session.customRequest('variables', { variablesReference: varRef });
				var rowsItemVariableRef = dataRowRes.variables.filter(x => x.name.includes('ItemArray'))[0].variablesReference;
				var rowItemRes = await session.customRequest('variables', { variablesReference: rowsItemVariableRef });
				var result = rowItemRes.variables.map(x => { return x.value });
				result = result.toString();
			}
			else if (variableType == "System.Data.DataTable")
			{
				var result = await getDataTableInformation(session, selectedVariable, variableResponse.variables.filter(x => x.evaluateName == selectedVariable));
			}
			else
			{
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
					result = utilities.getCustomParsedString(result);
				}
				else if(variableType.toLowerCase().includes("error".toLowerCase()))
				{
					var errorMessage = variableType;
					throw new Error(errorMessage);
				}
				else
				{
					var result = "Oops...Not supported variable, still in development!!!";
				}
			}

			// Create web view panel to display result
			const panel = vscode.window.createWebviewPanel(
				'csharp-debug-visualizer',
				'Visualize',
				vscode.ViewColumn.Two,
				{
					enableScripts: true,
					enableFindWidget: true
				}
			);
			panel.webview.html = webViewContent.getWebViewContent(selectedVariable, result, variableType);
		}
		catch(error) {
			vscode.window.showErrorMessage(error.message);
		}
	});

	context.subscriptions.push(disposable);
}

// #region Common methods or functions
// Get selected variable based on cursor position
function getSelectedVariable(editor)
{
	const cursorPosition = editor.selection.active;
	var charPosition = cursorPosition.character - 1;
	var previousCharacter = null;
	var startCursorPosition = cursorPosition.character;
	var nextCharacter = null;
	var endCursorPosition = cursorPosition.character;
	var charBreakArray = ['', ' ', '=', '(', ')', '{', '}', '[', ']', '.', ',', ';', '+', '-', '*', '/', '\\', '!', '`', '@', '#', '$', '~', '%', '^', '&', ':', '<', '>', '?', '|', '"', '\''];
	while(!charBreakArray.includes(previousCharacter))
	{
		previousCharacter = editor.document.getText(new vscode.Range(cursorPosition.line, charPosition, cursorPosition.line, charPosition + 1));
		if(charBreakArray.includes(previousCharacter))
			break;
		startCursorPosition = charPosition;
		charPosition--;
	}
	var charPosition = cursorPosition.character + 1;
	while(!charBreakArray.includes(nextCharacter))
	{
		nextCharacter = editor.document.getText(new vscode.Range(cursorPosition.line, charPosition, cursorPosition.line, charPosition - 1));
		if(charBreakArray.includes(nextCharacter))
			break;
		endCursorPosition = charPosition;
		charPosition++;
	}
	return editor.document.getText(new vscode.Range(cursorPosition.line, startCursorPosition, cursorPosition.line, endCursorPosition));
}

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
// #endregion

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}