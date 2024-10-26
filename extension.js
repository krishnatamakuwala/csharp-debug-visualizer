const vscode = require('vscode');
const webViewContent = require('./scripts/webViewContent');
const utilities = require('./scripts/utilities');

const recordPerPage = 25;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('csharp-debug-visualizer.visualize', async function () {

		// User settings for Extension 
		const extensionSettings = vscode.workspace.getConfiguration("charpDebugVisualizer");
		const primaryColor = extensionSettings.get("primaryColor");

		// Validate user settings
		if(!utilities.validateUserSettings(primaryColor))
		{
			vscode.window.showInformationMessage("Primary color is not valid!");
			return;
		}

		// Get access to editor
		const editor = vscode.window.activeTextEditor;
		if(!editor)
		{
			vscode.window.showInformationMessage("Editor does not exist!");
			return;
		}

		const selectedVariable = getSelectedVariable(editor);

		var currentPage = 1;
		var totalPage = 1;

		try {
			// Get Active Debug Session
			const session = vscode.debug.activeDebugSession;

			// Get Thread
			const threadResponse = await session.customRequest('threads');

			// Get StackFrame 
			// (PS: We can also use stackFrameId = 1000 as it is always 1000, so it will reduce call)
			var frameId = 0;
			var stackResponse;
			await Promise.all(threadResponse.threads.map(async (thread) => {
				stackResponse = await session.customRequest('stackTrace', { threadId: thread.id, startFrame: 0 });
				if (stackResponse.stackFrames.length > 0)
				{
					currentStackResponse = stackResponse.stackFrames.filter(x => x.id == 1000);
					if (currentStackResponse.length > 0)
						frameId = currentStackResponse[0].id;
				}
			}));

			// Get Scope
			const scopeResponse = await session.customRequest('scopes', { frameId: frameId });
			const variableReference = scopeResponse.scopes[0].variablesReference;

			// Get Variable
			const variableResponse = await session.customRequest('variables', { variablesReference: variableReference });
			const variables = variableResponse.variables;
			
			// Get type of variable
			const variableTypeResponse = await session.customRequest('evaluate', { expression: `${selectedVariable}.GetType().FullName`, frameId: frameId });
			const variableType = utilities.getCustomParsedString(variableTypeResponse.result);

			if(variableType.toLowerCase().includes("error".toLowerCase()))
			{
				var errorMessage = variableType;
				throw new Error(errorMessage);
			}

			vscode.window.showInformationMessage("Visualizing...");

			var result = await getResult(session, variableResponse, variables, variableType, selectedVariable, currentPage);
			currentPage = result.currentPage;
			totalPage = result.totalPage;

			vscode.window.showInformationMessage("Visualized");

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
			panel.webview.html = webViewContent.getWebViewContent(primaryColor, selectedVariable, result, variableType, currentPage, totalPage);
			panel.webview.onDidReceiveMessage(
				message => {
				  switch (message.command) {
					case 'getPaginatedData':
					  currentPage = parseInt(message.text);
					  updateWebView(primaryColor, panel, session, variableResponse, variables, variableType, selectedVariable, currentPage, totalPage);
					  return;
				  }
				},
				undefined,
				context.subscriptions
			  );
		}
		catch(error) {
			vscode.window.showErrorMessage(error.message);
		}
	});

	context.subscriptions.push(disposable);
}

// #region Common methods or functions

// Update Webview
async function updateWebView(primaryColor, panel, session, variableResponse, variables, variableType, selectedVariable, currentPage, totalPage)
{
	var result = await getResult(session, variableResponse, variables, variableType, selectedVariable, currentPage, totalPage);
	panel.webview.html = webViewContent.getWebViewContent(primaryColor, selectedVariable, result, variableType, currentPage, totalPage);
}

// Get result for selected variable
async function getResult(session, variableResponse, variables, variableType, selectedVariable, currentPage)
{
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
		result = await getMoreDataIfAny(session, result);
		result = result.variables.map(x => { return x.value });
		result = result.toString();
	}
	else if (variableType == "System.Data.DataColumn")
	{
		var varRef = variables.filter(x => x.evaluateName == selectedVariable)[0].variablesReference;
		var dataColumnRes = await session.customRequest('variables', { variablesReference: varRef });
		dataColumnRes = await getMoreDataIfAny(session, dataColumnRes);
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
		var result = await getDataTableInformation(session, selectedVariable, variableResponse.variables.filter(x => x.evaluateName == selectedVariable), currentPage);
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
		else if(variableType.includes("System.NullReferenceException"))
		{
			var result = "null";
		}
		else
		{
			var result = "Oops...Not supported variable, still in development!!!";
		}
	}
	return result;
}

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
async function getDataTableInformation(session, selectedVariable, variable, currentPage)
{
	try
	{
		var res = {};
		res.name = selectedVariable;

		const dtRef = variable[0].variablesReference;
		const resForDt = await session.customRequest('variables', { variablesReference: dtRef });

		var columnResult = await getColumnsOfDataTable(session, res, resForDt);
		var rowResult = await getRowsOfDataTable(session, res, resForDt, recordPerPage, currentPage);

		res.Columns = columnResult.Columns;
		res.Rows = rowResult.Rows;
		res.currentPage = currentPage;
		res.totalPage = rowResult.totalPage;
		return res;
	}
	catch(error) {
		return error;
	}
}

// Get columns from data table
async function getColumnsOfDataTable(session, res, dataTable)
{
	res.Columns = {};

	const columnRef = dataTable.variables.filter(x => x.evaluateName == `${res.name}.Columns`)[0].variablesReference;
	const resForColumn = await session.customRequest('variables', { variablesReference: columnRef });
	res.Columns.Count = resForColumn.variables.filter(x => x.evaluateName == `${res.name}.Columns.Count`)[0].value;
	var resForColumnList = await session.customRequest('variables', { variablesReference: resForColumn.variables.filter(x => x.evaluateName == `${res.name}.Columns.List`)[0].variablesReference });

	resForColumnList = await getMoreDataIfAny(session, resForColumnList);
	res.Columns.List = resForColumnList.variables.filter(x => x.name != 'Raw View').map(x => { return x.value });

	return res;
}

// Get rows from data table
async function getRowsOfDataTable(session, res, dataTable, recordPerPage, currentPage)
{
	res.Rows = {};

	const rowRef = dataTable.variables.filter(x => x.evaluateName == `${res.name}.Rows`)[0].variablesReference;
	const resForRow = await session.customRequest('variables', { variablesReference: rowRef });
	res.Rows.Count = resForRow.variables.filter(x => x.evaluateName == `${res.name}.Rows.Count`)[0].value;
	var resForRowList = await session.customRequest('variables', { variablesReference: resForRow.variables.filter(x => x.evaluateName == `${res.name}.Rows, results`)[0].variablesReference });
		
	// Calculate total page based on count of rows
	if (res.Rows.Count < (recordPerPage * 2))
	{
		res.totalPage = Math.ceil(res.Rows.Count / recordPerPage);
	}
	else
	{
		if (res.Rows.Count % recordPerPage > 3)
			res.totalPage = Math.ceil(res.Rows.Count / recordPerPage);
		else
			res.totalPage = Math.trunc(res.Rows.Count / recordPerPage);
	}

	resForRowList = await getPaginatedData(session, resForRowList, currentPage);
	var rows = [];
	if (resForRowList.variables[0].name !== 'Empty [string]') {
		await Promise.all(resForRowList.variables.map(async (rowVariable) => {
			var row = await session.customRequest('variables', { variablesReference: rowVariable.variablesReference });
			rows.push(row);
		}));
	
		var rowsItemVariableRef = rows.map(row => { return row.variables }).map(row => { return row.filter(x => x.name.includes('ItemArray'))[0].variablesReference });
		var rowItemArray = [];
		await Promise.all(rowsItemVariableRef.map(async (rowItem) => {
			var rowItem = await session.customRequest('variables', { variablesReference: rowItem });
			rowItemArray.push(rowItem);
		}));
	
		res.Rows.List = await Promise.all(rowItemArray.map(async (row) => { row = await getMoreDataIfAny(session, row); return row.variables.map(rowItem =>  { return rowItem.value }) }));
	} else {
		res.Rows.List = [];
	}
	return res;
}

// Get more data if available
async function getMoreDataIfAny(session, variableResponse)
{
	var moreRows = variableResponse.variables.filter(x => x.name == '[More]');
	while(moreRows.length > 0)
	{
		var index = variableResponse.variables.indexOf(moreRows);
		variableResponse.variables.splice(index, 1);
		var moreRowsResult = await session.customRequest('variables', { variablesReference: moreRows[0].variablesReference });
		variableResponse.variables.push(...moreRowsResult.variables);
		moreRows = variableResponse.variables.filter(x => x.name == '[More]');
	}
	return variableResponse;
}

// Get paginated data for DataTable
async function getPaginatedData(session, resForRowList, currentPage)
{
	var moreRows = resForRowList.variables.filter(x => x.name == '[More]');
	var i = 1;
	while (moreRows.length > 0 && i <= currentPage)
	{
		var index = resForRowList.variables.indexOf(moreRows);
		resForRowList.variables.splice(index, 1);
		if (currentPage > i)
		{
			var moreRowsResult = await session.customRequest('variables', { variablesReference: moreRows[0].variablesReference });
			if (currentPage - 1 == i)
			{
				resForRowList.variables = [];
				resForRowList.variables.push(...moreRowsResult.variables);
				moreRows = resForRowList.variables.filter(x => x.name == '[More]');
			}
			else
			{
				moreRows = moreRowsResult.variables.filter(x => x.name == '[More]');
			}
		}
		i++;
	}
	return resForRowList;
}
// #endregion

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}