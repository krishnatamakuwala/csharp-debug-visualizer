import { DebugSession, debug } from "vscode";
import { DebugProxy } from "./DebugProxy";
import { DebugSessionDetails } from "./DebugSessionDetails";
import { Disposable } from "vscode";

export class CustomDebugAdapter {
    private _activeSession: DebugSessionDetails | undefined;

    /**
     * Get active session
     */
    public get activeSession(): DebugSessionDetails | undefined {
        return this._activeSession;
    }

    constructor (private debugProxy: DebugProxy) {
        debug.onDidChangeActiveDebugSession(activeDebugSession => {
            this.updateActiveSession(activeDebugSession);
        });

        this.updateActiveSession(debug.activeDebugSession);
    }

    /**
     * Update active debug session
     * @param activeDebugSession Active debug session
     */
    private async updateActiveSession(activeDebugSession: DebugSession | undefined) {
        this._activeSession = activeDebugSession
                            ? this.debugProxy.getDebugSessionDetails(activeDebugSession)
                            : undefined;
        console.log("active session : ", this._activeSession);
    }

    /**
     * Get active stack frame based on active debug session
     */
    public async getActiveStackFrame() {
        if (this.activeSession !== undefined) {
            const threads = await this.activeSession.getThreads();
            console.log(typeof(threads));
            console.log(threads);
            var stackTrace;
            await Promise.all(threads.map(async (thread) => {
                if (this.activeSession !== undefined && this.activeSession.activeStackFrameId === undefined)
                {
                    stackTrace = await this.activeSession.getStackTrace(thread.id, 0);
                    if (stackTrace.totalFrames !== undefined && stackTrace.totalFrames > 0 && this.activeSession.activeStackFrameId === undefined)
                    {
                        this.activeSession.activeStackFrameId = stackTrace.stackFrames.find(x => x.id === 1000)?.id;
                    }
                }
            }));
        }
    }

    /**
     * Get parent variable list or first level variables
     */
    public async getParentVariablesList(): Promise<any> {
        var parentVariableList: any = [];
        if (this.activeSession !== undefined && this.activeSession.activeStackFrameId !== undefined)
        {
            const scopes = await this.activeSession.getScopes(this.activeSession.activeStackFrameId);
            parentVariableList = await this.activeSession.getVariables(scopes[0].variablesReference, 0 ,0);
        }
        return parentVariableList;
    }
}