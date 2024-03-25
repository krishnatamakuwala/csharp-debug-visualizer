import { DebugSession } from "vscode";

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
        try {
            const result = await this._session.customRequest("threads");
            return result.threads as IThread[];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Get stack trace of a particular thread
     * @param threadId Id of a particular thread
     * @param levels The maximum number of frames to return, default value is 0 (which will return all the frames)
     * @param startFrame The index of the first frame to return, default value is 0
     * @returns {Promise<IStackTraceInfo>} Promise of stack trace details
     */
    public async getStackTrace(threadId: number, startFrame: number | 0): Promise<IStackTraceInfo> {
        try {
            const result = await this._session.customRequest("stackTrace", {
                threadId: threadId,
                startFrame: startFrame
            }) as IStackTraceInfo;
            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Get scopes of a particular stack frame
     * @param frameId Id of a particular stack frame
     * @returns {Promise<IScope[]>} Promise of scopes
     */
    public async getScopes(frameId: number): Promise<IScope[]> {
        try {
            const result = await this._session.customRequest("scopes", {
               frameId: frameId
            });
            return result.scopes as IScope[];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Get variables by variable reference
     * @param variablesReference Reference id of variable
     * @param start The index of the first variable to return, default value is 0
     * @param count The number of variables to return, default value is 0, which will return all variables
     * @returns {Promise<IVariable[]>} Promise of variables
     */
    public async getVariables(variablesReference: number, start: number | 0, count: number | 0): Promise<IVariable[]> {
        try {
            const result = await this._session.customRequest("variables", {
               variablesReference: variablesReference,
               start: start,
               count: count
            });
            return result.variables as IVariable[];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Get evaluated result of expression
     * @param expression Expression
     * @param frameId Id of a particular stack frame
     * @param context The context in which the evaluate request is used
     * @returns {Promise<EvaluateResult>} Promise of evaluated result
     */
    public async evaluateExpression(expression: string, frameId: number, context: "watch" | "repl" | "hover" | "clipboard"| "variables" | string): Promise<IEvaluatedResult> {
        try {
            const result = await this._session.customRequest("evaluate", {
               expression: expression,
               frameId: frameId,
               context: context
            }) as IEvaluatedResult;
            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

interface IThread {
    id: number;
    name: string;
}

interface IStackTraceInfo {
    totalFrames?: number;
    stackFrames: IStackFrame[];
}

interface IStackFrame {
    id: number;
	name: string;
	source: { name: string; path: string };
}

interface IScope {
    name: string;
    variablesReference: number;
}

interface IVariable {
    name: string;
    value: string;
    evaluateName?: string;
    variablesReference: number;
}

interface IEvaluatedResult {
    result: string;
    variablesReference: string;
}