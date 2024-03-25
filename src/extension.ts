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

// This method is called when extension is activated
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('typescript-test-extension-2.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		RequestStatus.status = RequestStatusType.Started;

		let customDebugAdapter: CustomDebugAdapter | undefined;
		let session: DebugSessionDetails | undefined;
		ProgressTracker.progress = 0;
		try {
			RequestStatus.status = RequestStatusType.InProgress;

			//#region Get session and active stack frame
			customDebugAdapter = new CustomDebugAdapter(new DebugProxy);
			await customDebugAdapter.getActiveStackFrame();
			session = customDebugAdapter.activeSession;
			//#endregion

			const editor = vscode.window.activeTextEditor;
			if(!editor) {
				throw ErrorMessage.editorNotExists;
			}
			Variable.varName = Editor.getSelectedVariable(editor);

			if (session !== undefined && session?.activeStackFrameId !== undefined) {
				try {
					//#region Get type of a selected variable
					Variable.type = (await session?.evaluateExpression(`${Variable.varName}.GetType().FullName`, session?.activeStackFrameId, "variables")).result;
					Variable.type = Editor.getCustomParsedString(Variable.type);
					if(Variable.type.toLowerCase().includes("error".toLowerCase()))
					{
						var errorMessage = Variable.type;
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
							RequestStatus.status = RequestStatusType.Cancelled;
						});

						progress.report({ increment: (10 - ProgressTracker.progress) });
						ProgressTracker.progress = 10;

						await ResultHelper.getResult(customDebugAdapter, session, progress);

						progress.report({ increment: (100 - ProgressTracker.progress) });
						ProgressTracker.progress = 100;
						if (RequestStatus.status === RequestStatusType.InProgress) {
							RequestStatus.status = RequestStatusType.Completed;
						}

						const p = new Promise<RequestStatusType>((resolve, reject) => {
							switch (RequestStatus.status) {
								case RequestStatusType.Completed:
								case RequestStatusType.Cancelled:
									resolve(RequestStatus.status);
									break;
								case RequestStatusType.Failed:
									reject();
									break;
								default:
									break;
							}
						});
			
						return p;
					});
					//#endregion

					if (processResult === RequestStatusType.Completed) {
						NotificationManager.showMessage(InformationMessage.visualized, MessageType.Information);
					} else if (processResult === RequestStatusType.Cancelled) {
						NotificationManager.showMessage(WarningMessage.cancelled, MessageType.Warning);
					}

					console.log(Variable.varName + " : " + Variable.type + " : " + Variable.result);
				} catch (error) {
					throw error;
				}
			}
			else {
				throw ErrorMessage.undefinedSession;
			}
		} catch (error) {
			RequestStatus.status = RequestStatusType.Failed;
			NotificationManager.showMessage((error as Error).message, MessageType.Error);
		}	
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
