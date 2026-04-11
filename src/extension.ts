import * as vscode from 'vscode';
import { NotificationManager } from './utilities/NotificationManager';
import { Logger } from './utilities/Logger';
import { MessageType } from './constants/messages';
import { executeVisualize } from './commands/VisualizeCommand';
import { CustomDebugAdapter } from './debug/debugAdapter';
import { Configuration } from './config/configuration';

// This method is called when extension is activated
export function activate(context: vscode.ExtensionContext) {
	try {
		// Start reactive configuration watcher
		context.subscriptions.push(Configuration.watch());

		let disposable = vscode.commands.registerCommand('csharp-debug-visualizer.visualize', async () => {
			await executeVisualize(context);
		});

		context.subscriptions.push(disposable);
	} catch (error) {
		const err = error as Error;
		NotificationManager.showMessage(err.message ?? "An unexpected error occurred.", MessageType.error);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	CustomDebugAdapter.getInstance().dispose();
	Logger.dispose();
}
