import { DebugSession, DebugStackFrame, DebugThread, debug } from "vscode";
import { DebugProxy } from "./DebugProxy";
import { DebugSessionDetails } from "./DebugSessionDetails";

export class CustomDebugAdapter {
    private _activeSession: DebugSessionDetails | undefined;

    /**
     * Get active session
     */
    public get activeSession(): DebugSessionDetails | undefined {
        return this._activeSession;
    }

    /**
     * Custom Debug Adapter object to send requests to debug adapter protocol
     * @param debugProxy 
     */
    constructor (private debugProxy: DebugProxy) {
        debug.onDidChangeActiveDebugSession(activeDebugSession => {
            this.updateActiveSession(activeDebugSession);
        });

        debug.onDidChangeActiveStackItem(activeStackItem => {
            this.updateActiveStackFrame(activeStackItem);
        });

        this.updateActiveSession(debug.activeDebugSession);
        this.updateActiveStackFrame(debug.activeStackItem);
    }

    /**
     * Update active debug session
     * @param activeDebugSession Active debug session
     */
    private async updateActiveSession(activeDebugSession: DebugSession | undefined) {
        this._activeSession = activeDebugSession
                            ? this.debugProxy.getDebugSessionDetails(activeDebugSession)
                            : undefined;
    }

    /**
     * Get active stack frame based on active debug session
     */
    public async updateActiveStackFrame(activeStackItem: DebugThread | DebugStackFrame | undefined) {
        if (this.activeSession !== undefined && activeStackItem instanceof DebugStackFrame) {
            this.activeSession.activeStackFrameId = activeStackItem.frameId;
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