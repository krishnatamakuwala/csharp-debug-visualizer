import * as vscode from 'vscode';
import { CustomDebugAdapter } from '../debug/debugAdapter';
import { DataTableConfig, Variable } from '../models/Variable';
import { InformationMessage, WarningMessage } from '../constants/messages';
import { ResultHelper } from '../providers/resultFactory';
import { OnHeaderReady } from '../providers/dataTableProvider';
import { OnBatchReady } from '../providers/dataTableRows';
import { RequestStatusType } from '../constants/requestStatus';
import { DebugSessionDetails } from '../debug/debugSession';
import { RequestContext } from '../models/RequestContext';
import { NotificationManager } from '../utilities/NotificationManager';
import { MessageType } from '../constants/messages';
import { UndefinedSessionError } from '../errors/errors';
import { ProcessResult } from '../models/ProcessResult';

/**
 * Manages result retrieval with VS Code progress notifications
 */
export class ResultRetrievalService {

    /**
     * Fetch result with a progress notification bar
     */
    static async withProgress(
        customDebugAdapter: CustomDebugAdapter,
        session: DebugSessionDetails,
        variable: Variable,
        config: DataTableConfig | null = null,
        onHeaderReady: OnHeaderReady | null = null,
        onBatchReady: OnBatchReady | null = null,
        requestContext: RequestContext = new RequestContext()
    ): Promise<ProcessResult> {
        const processResult = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: InformationMessage.visualizing,
            cancellable: true
        }, async (progress, token) => {
            requestContext.status = RequestStatusType.inProgress;
            token.onCancellationRequested(() => {
                requestContext.status = RequestStatusType.cancelled;
            });

            progress.report({ increment: (5 - requestContext.progress) });
            requestContext.progress = 5;

            const result = await ResultHelper.getResult(customDebugAdapter, session, variable, progress, config, onHeaderReady, onBatchReady, requestContext);
            if (result !== RequestStatusType.cancelled) {
                variable = result;
            }

            progress.report({ increment: (100 - requestContext.progress) });
            requestContext.progress = 100;
            if (requestContext.status === RequestStatusType.inProgress) {
                requestContext.status = RequestStatusType.completed;
            }

            return new Promise<ProcessResult>((resolve, reject) => {
                switch (requestContext.status) {
                    case RequestStatusType.completed:
                    case RequestStatusType.cancelled:
                        resolve({
                            requestStatusType: requestContext.status,
                            variable: variable
                        });
                        break;
                    case RequestStatusType.failed:
                        reject(new Error("Visualization request failed."));
                        break;
                }
            });
        });
        return processResult;
    }

    /**
     * Show result notification based on status
     */
    static showResultNotification(requestStatusType: RequestStatusType): void {
        if (requestStatusType === RequestStatusType.completed) {
            NotificationManager.showMessage(InformationMessage.visualized, MessageType.information);
        } else if (requestStatusType === RequestStatusType.cancelled) {
            NotificationManager.showMessage(WarningMessage.cancelled, MessageType.warning);
        }
    }

    /**
     * Get result with provided config (used by webview for pagination)
     */
    static async getResultWithConfig(
        config: DataTableConfig,
        variable: Variable,
        onHeaderReady: OnHeaderReady | null = null,
        onBatchReady: OnBatchReady | null = null
    ): Promise<Variable> {
        const customDebugAdapter = CustomDebugAdapter.getInstance();
        const session = customDebugAdapter.activeSession;
        if (session === undefined) {
            throw new UndefinedSessionError();
        }
        const processResult = await ResultRetrievalService.withProgress(customDebugAdapter, session, variable, config, onHeaderReady, onBatchReady);
        ResultRetrievalService.showResultNotification(processResult.requestStatusType);
        return processResult.variable;
    }

    /**
     * Refresh data for variable (used by webview refresh button)
     */
    static async refreshData(
        variable: Variable,
        onHeaderReady: OnHeaderReady | null = null,
        onBatchReady: OnBatchReady | null = null
    ): Promise<Variable> {
        const customDebugAdapter = CustomDebugAdapter.getInstance();
        const session = customDebugAdapter.activeSession;
        if (session === undefined) {
            throw new UndefinedSessionError();
        }
        const processResult = await ResultRetrievalService.withProgress(customDebugAdapter, session, variable, null, onHeaderReady, onBatchReady);
        ResultRetrievalService.showResultNotification(processResult.requestStatusType);
        return processResult.variable;
    }
}
