import * as vscode from 'vscode';
import { CustomDebugAdapter } from '../debug/debugAdapter';
import { Editor } from '../utilities/Editor';
import { StringUtils } from '../utilities/StringUtils';
import { NotificationManager } from '../utilities/NotificationManager';
import { Logger } from '../utilities/Logger';
import { MessageType } from '../constants/messages';
import { Variable } from '../models/Variable';
import { RequestStatusType } from '../constants/requestStatus';
import { RequestContext } from '../models/RequestContext';
import { WebViewHelper } from '../webview/webviewManager';
import { Configuration } from '../config/configuration';
import { OtherVariableType } from '../constants/variableTypes';
import { BaseError, EditorNotFoundError, UndefinedSessionError } from '../errors/errors';
import { ResultRetrievalService } from './resultRetrievalService';

/**
 * Execute the visualize command — thin orchestrator
 */
export async function executeVisualize(context: vscode.ExtensionContext) {
    const requestContext = new RequestContext();

    let variable = new Variable();
    try {
        requestContext.status = RequestStatusType.inProgress;
        Logger.info("=== Visualize command started ===");

        const customDebugAdapter = CustomDebugAdapter.getInstance();
        const session = customDebugAdapter.activeSession;
        Logger.info(`Session: ${session ? "active" : "undefined"}, StackFrameId: ${session?.activeStackFrameId}`);

        Configuration.configure();
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new EditorNotFoundError();
        }
        variable.varName = Editor.getSelectedVariable(editor);
        Logger.info(`Selected variable: "${variable.varName}"`);

        if (!Editor.isValidVariableName(variable.varName)) {
            throw new Error(`Invalid variable name: "${variable.varName}". Only valid C# identifiers are supported.`);
        }

        if (session === undefined) {
            throw new UndefinedSessionError();
        }

        // Resolve variable type
        const evalResult = await session.evaluateExpression(`${variable.varName}.GetType().FullName`, "variables");
        Logger.info(`Type evaluation result`, { result: evalResult?.result, variablesReference: evalResult?.variablesReference });
        if (!evalResult || evalResult.result === undefined || evalResult.result === null) {
            throw new Error("Failed to evaluate variable type.");
        }
        variable.type = StringUtils.removeLeadingAndTrailingQuotes(String(evalResult.result));
        Logger.info(`Resolved type: "${variable.type}"`);

        if (variable.type.toLowerCase().includes("error")) {
            throw new Error(variable.type);
        }
        if (variable.type.includes("System.NullReferenceException")) {
            variable.type = OtherVariableType.null;
        }

        // Retrieve result with progress
        const processResult = await ResultRetrievalService.withProgress(customDebugAdapter, session, variable, null, null, null, requestContext);
        Logger.info(`Result status: ${processResult.requestStatusType}`, {
            hasResult: processResult.variable.result !== "",
            resultType: typeof processResult.variable.result
        });

        if (processResult.requestStatusType === RequestStatusType.cancelled) {
            Logger.warn("Request was cancelled — skipping webview creation");
            ResultRetrievalService.showResultNotification(processResult.requestStatusType);
            return;
        }

        // Create webview
        const webViewHelper = new WebViewHelper();
        webViewHelper.createWebView(
            context,
            processResult.variable,
            ResultRetrievalService.getResultWithConfig,
            ResultRetrievalService.refreshData
        );

        ResultRetrievalService.showResultNotification(processResult.requestStatusType);
        Logger.info("=== Visualize command completed ===");
    } catch (error) {
        requestContext.status = RequestStatusType.failed;
        const err = error as BaseError;
        Logger.error(`Visualize command failed for "${variable.varName}"`, error);
        NotificationManager.showMessage(err.message, MessageType.error);
    }
}

