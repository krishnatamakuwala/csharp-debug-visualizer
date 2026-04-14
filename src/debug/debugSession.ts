import { DebugSession } from "vscode";
import { IThread, IStackTraceInfo, IScope, IVariable, IEvaluatedResult } from "../types/dap";

// Re-export interfaces so existing imports from this file continue to work
export type { IScope, IVariable, IEvaluatedResult } from "../types/dap";

export class DebugSessionDetails {
    private _activeStackFrameId: number | undefined;

    public get activeStackFrameId(): number | undefined {
        return this._activeStackFrameId;
    }

    public set activeStackFrameId(value: number | undefined) {
        this._activeStackFrameId = value;
    }

    private readonly _session: DebugSession;

    constructor(session: DebugSession) {
        this._session = session;
    }

    /**
     * Get threads of current active session
     * @returns {Promise<IThread[]>} Promise of thread response
     */
    public async getThreads(): Promise<IThread[]> {
        const result = await this._session.customRequest("threads");
        return result.threads as IThread[];
    }

    /**
     * Get stack trace of a particular thread
     * @param threadId Id of a particular thread
     * @param startFrame The index of the first frame to return, default value is 0
     * @returns {Promise<IStackTraceInfo>} Promise of stack trace details
     */
    public async getStackTrace(threadId: number, startFrame: number | 0): Promise<IStackTraceInfo> {
        const result = await this._session.customRequest("stackTrace", {
            threadId: threadId,
            startFrame: startFrame
        }) as IStackTraceInfo;
        return result;
    }

    /**
     * Get scopes of a particular stack frame
     * @param frameId Id of a particular stack frame
     * @returns {Promise<IScope[]>} Promise of scopes
     */
    public async getScopes(frameId: number): Promise<IScope[]> {
        const result = await this._session.customRequest("scopes", {
           frameId: frameId
        });
        return result.scopes as IScope[];
    }

    /**
     * Get variables by variable reference
     * @param variablesReference Reference id of variable
     * @param start The index of the first variable to return, default value is 0
     * @param count The number of variables to return, default value is 0, which will return all variables
     * @returns {Promise<IVariable[]>} Promise of variables
     */
    public async getVariables(variablesReference: number, start: number | 0, count: number | undefined | 0 = undefined): Promise<IVariable[]> {
        const result = await this._session.customRequest("variables", {
           variablesReference: variablesReference,
           start: start,
           count: count
        });
        return result.variables as IVariable[];
    }

    /**
     * Get evaluated result of expression
     * @param expression Expression
     * @param context The context in which the evaluate request is used
     * @param frameId Id of a particular stack frame
     * @returns {Promise<IEvaluatedResult>} Promise of evaluated result
     */
    public async evaluateExpression(expression: string, context: "watch" | "repl" | "hover" | "clipboard" | "variables", frameId?: number): Promise<IEvaluatedResult> {
        const result = await this._session.customRequest("evaluate", {
           expression: expression,
           frameId: frameId ?? this.activeStackFrameId,
           context: context
        }) as IEvaluatedResult;
        return result;
    }
}
