import * as vscode from 'vscode';
import { DebugProxy } from './Proxies/DebugProxy';
import { CustomDebugAdapter } from './Proxies/CustomDebugAdapter';
import { Editor } from './Utilities/Editor';
import { NotificationManager } from './Utilities/NotificationManager';
import { MessageType } from './Enums/MessageType';
import { Variable } from './Models/Variable';
import { ErrorMessage, InformationMessage, WarningMessage } from './Enums/Message';
import { ResultHelper } from './Helpers/ResultHelper';
import { RequestStatusType } from './Enums/RequestStatusType';
import { DebugSessionDetails } from './Proxies/DebugSessionDetails';
import { RequestStatus, ProgressTracker } from './Models/RequestProgressStatus';
import { WebViewHelper } from './Helpers/WebViewHelper';
import { Themes } from './Models/Configuration';

// This method is called when extension is activated
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('typescript-test-extension-2.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		RequestStatus.status = RequestStatusType.started;

		let customDebugAdapter: CustomDebugAdapter | undefined;
		let session: DebugSessionDetails | undefined;
		var variable = new Variable();
		ProgressTracker.progress = 0;
		try {
			RequestStatus.status = RequestStatusType.inProgress;

			//#region Get session and active stack frame
			customDebugAdapter = new CustomDebugAdapter(new DebugProxy);
			session = customDebugAdapter.activeSession;
			//#endregion
			
			Themes.configureTheme();
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				throw ErrorMessage.editorNotExists;
			}
			variable.varName = Editor.getSelectedVariable(editor);

			if (session !== undefined && session?.activeStackFrameId !== undefined) {
				try {
					//#region Get type of a selected variable
					variable.type = (await session?.evaluateExpression(`${variable.varName}.GetType().FullName`, session?.activeStackFrameId, "variables")).result;
					variable.type = Editor.getCustomParsedString(variable.type);
					if(variable.type.toLowerCase().includes("error".toLowerCase()))
					{
						var errorMessage = variable.type;
						throw new Error(errorMessage);
					}
					//#endregion

					//#region Get result with progress notification bar
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

						await ResultHelper.getResult(customDebugAdapter, session, variable, progress);

						progress.report({ increment: (100 - ProgressTracker.progress) });
						ProgressTracker.progress = 100;
						if (RequestStatus.status === RequestStatusType.inProgress) {
							RequestStatus.status = RequestStatusType.completed;
						}

						const p = new Promise<RequestStatusType>((resolve, reject) => {
							switch (RequestStatus.status) {
								case RequestStatusType.completed:
								case RequestStatusType.cancelled:
									resolve(RequestStatus.status);
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
					//#endregion

					//#region Create Webview
					let webViewHelper = new WebViewHelper();
					webViewHelper.createWebView(context, variable);
					//#endregion

					if (processResult === RequestStatusType.completed) {
						NotificationManager.showMessage(InformationMessage.visualized, MessageType.information);
					} else if (processResult === RequestStatusType.cancelled) {
						NotificationManager.showMessage(WarningMessage.cancelled, MessageType.warning);
					}

					console.log(variable.varName + " : " + variable.type + " : " + variable.result);
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
}

// This method is called when your extension is deactivated
export function deactivate() {}