import * as vscode from 'vscode';
import { DebugProxy } from './Proxies/DebugProxy';
import { CustomDebugAdapter } from './Proxies/CustomDebugAdapter';
import { Editor } from './Utilities/Editor';
import { NotificationManager } from './Utilities/NotificationManager';
import { MessageType } from './Enums/MessageType';
import { DataTableConfig, Variable } from './Models/Variable';
import { ErrorMessage, InformationMessage, WarningMessage } from './Enums/Message';
import { ResultHelper } from './Helpers/ResultHelper';
import { RequestStatusType } from './Enums/RequestStatusType';
import { DebugSessionDetails } from './Proxies/DebugSessionDetails';
import { RequestStatus, ProgressTracker } from './Models/RequestProgressStatus';
import { WebViewHelper } from './Helpers/WebViewHelper';
import { Configuration } from './Models/Configuration';
import { OtherVariableType } from './Enums/VariableType';

// This method is called when extension is activated
export function activate(context: vscode.ExtensionContext) {
	try {
		let disposable = vscode.commands.registerCommand('csharp-debug-visualizer.visualize', async () => {
			// The code you place here will be executed every time your command is executed
			RequestStatus.status = RequestStatusType.started;

			let session: DebugSessionDetails | undefined;
			var variable = new Variable();
			ProgressTracker.progress = 0;
			try {
				RequestStatus.status = RequestStatusType.inProgress;

				//#region Get session and active stack frame
				const customDebugAdapter: CustomDebugAdapter = new CustomDebugAdapter(new DebugProxy);
				session = customDebugAdapter.activeSession;
				//#endregion

				Configuration.configure();
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					throw ErrorMessage.editorNotExists;
				}
				variable.varName = Editor.getSelectedVariable(editor);

				if (session !== undefined && session?.activeStackFrameId !== undefined) {
					try {
						//#region Get type of a selected variable
						variable.type = (await session?.evaluateExpression(`${variable.varName}.GetType().FullName`, session?.activeStackFrameId, "variables")).result as string;
						variable.type = Editor.removeLeadingAndTrailingQuotes(variable.type);
						if (variable.type.toLowerCase().includes("error".toLowerCase())) {
							var errorMessage = variable.type;
							throw new Error(errorMessage);
						}
						if (variable.type.includes("System.NullReferenceException")) {
							variable.type = OtherVariableType.null;
						}
						//#endregion

						//#region Get result with progress notification bar
						const processResult = await withProgress(customDebugAdapter, session, variable);
						//#endregion

						//#region Create Webview
						let webViewHelper = new WebViewHelper();
						webViewHelper.createWebView(context, processResult.variable);
						//#endregion

						showResultNotification(processResult.requestStatusType);

					} catch (error) {
						throw error;
					}
				}
				else {
					throw Error(ErrorMessage.undefinedSession);
				}
			} catch (error) {
				RequestStatus.status = RequestStatusType.failed;
				NotificationManager.showMessage((error as Error).message, MessageType.error);
			}
		});

		context.subscriptions.push(disposable);
	} catch (error) {
		console.error(error);
	}
}

/**
 * Start VS Code progress with result callback
 * @param customDebugAdapter Custom debug adapter
 * @param session Debug session details
 * @param variable Variable
 * @returns 
 */
export async function withProgress(customDebugAdapter: CustomDebugAdapter, session: DebugSessionDetails | undefined, variable: Variable, config: DataTableConfig | null = null): Promise<ProcessResult> {
	let processResult = await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: InformationMessage.visualizing,
		cancellable: true
	}, async (progress, token) => {
		token.onCancellationRequested(() => {
			RequestStatus.status = RequestStatusType.cancelled;
		});

		progress.report({ increment: (5 - ProgressTracker.progress) });
		ProgressTracker.progress = 5;

		const result = await ResultHelper.getResult(customDebugAdapter, session, variable, progress, config);
		if (result !== RequestStatusType.cancelled) {
			variable = result;
		}

		progress.report({ increment: (100 - ProgressTracker.progress) });
		ProgressTracker.progress = 100;
		if (RequestStatus.status === RequestStatusType.inProgress) {
			RequestStatus.status = RequestStatusType.completed;
		}

		const p = new Promise<ProcessResult>((resolve, reject) => {
			switch (RequestStatus.status) {
				case RequestStatusType.completed:
				case RequestStatusType.cancelled:
					const _processResult: ProcessResult = {
						requestStatusType: RequestStatus.status,
						variable: variable
					}
					resolve(_processResult);
					break;
				case RequestStatusType.failed:
					reject();
					break;
				default:
					break;
			}
		});

		return p;
	});
	return processResult;
}

/**
 * Show result notification
 * @param requestStatusType Request status type
 */
export function showResultNotification(requestStatusType: RequestStatusType) {
	if (requestStatusType === RequestStatusType.completed) {
		NotificationManager.showMessage(InformationMessage.visualized, MessageType.information);
	} else if (requestStatusType === RequestStatusType.cancelled) {
		NotificationManager.showMessage(WarningMessage.cancelled, MessageType.warning);
	}
}

/**
 * Get result of variable with provided config
 * @param config Variable config
 * @param variable Variable
 * @returns 
 */
export async function getResultWithConfig(config: DataTableConfig, variable: Variable): Promise<Variable> {
	const customDebugAdapter: CustomDebugAdapter = new CustomDebugAdapter(new DebugProxy);
	const session: DebugSessionDetails | undefined = customDebugAdapter.activeSession;
	const processResult = await withProgress(customDebugAdapter, session, variable, config);
	showResultNotification(processResult.requestStatusType);
	return processResult.variable;
}

export async function refreshData(variable: Variable) {
	const customDebugAdapter: CustomDebugAdapter = new CustomDebugAdapter(new DebugProxy);
	const session: DebugSessionDetails | undefined = customDebugAdapter.activeSession;
	const processResult = await withProgress(customDebugAdapter, session, variable);
	showResultNotification(processResult.requestStatusType);
	return processResult.variable;
}

interface ProcessResult {
	variable: Variable;
	requestStatusType: RequestStatusType;
}

// This method is called when your extension is deactivated
export function deactivate() { }