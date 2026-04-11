import { DebugSession, DebugStackFrame, DebugThread, Disposable, debug } from "vscode";
import { DebugProxy } from "./debugProxy";
import { DebugSessionDetails, IScope, IVariable } from "./debugSession";
import { Logger } from "../utilities/Logger";

export class CustomDebugAdapter {
    private _activeSession: DebugSessionDetails | undefined;
    private _disposables: Disposable[] = [];

    private static _instance: CustomDebugAdapter | undefined;

    /**
     * Get or create the singleton instance.
     * Prevents event listener leaks from repeated instantiation.
     */
    public static getInstance(debugProxy?: DebugProxy): CustomDebugAdapter {
        if (!CustomDebugAdapter._instance) {
            CustomDebugAdapter._instance = new CustomDebugAdapter(debugProxy ?? new DebugProxy());
        }
        return CustomDebugAdapter._instance;
    }

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
        this._disposables.push(
            debug.onDidChangeActiveDebugSession(activeDebugSession => {
                this.updateActiveSession(activeDebugSession);
            })
        );

        this._disposables.push(
            debug.onDidChangeActiveStackItem(activeStackItem => {
                this.updateActiveStackFrame(activeStackItem);
            })
        );

        this.updateActiveSession(debug.activeDebugSession);
        this.updateActiveStackFrame(debug.activeStackItem);
    }

    /**
     * Dispose event listeners to prevent memory leaks
     */
    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
        if (CustomDebugAdapter._instance === this) {
            CustomDebugAdapter._instance = undefined;
        }
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
     * @param activeStackItem Active Stackframe Id
     */
    public async updateActiveStackFrame(activeStackItem: DebugThread | DebugStackFrame | undefined) {
        if (this.activeSession !== undefined && activeStackItem instanceof DebugStackFrame) {
            this.activeSession.activeStackFrameId = activeStackItem.frameId;
        }
    }

    /**
     * Get parent variable list or first level variables
     */
    public async getParentVariablesList(): Promise<IVariable[]> {
        let parentVariableList: IVariable[] = [];
        if (this.activeSession !== undefined && this.activeSession.activeStackFrameId !== undefined)
        {
            const scopes: IScope[] = await this.activeSession.getScopes(this.activeSession.activeStackFrameId);
            Logger.info(`Scopes: ${scopes.length} scope(s) — using "${scopes[0]?.name}" (ref=${scopes[0]?.variablesReference})`);
            parentVariableList = await this.activeSession.getVariables(scopes[0].variablesReference, 0 ,0);
            Logger.info(`Parent variables: ${parentVariableList.length} variable(s) returned`,
                parentVariableList.map(v => ({ name: v.name, evaluateName: v.evaluateName, value: v.value?.substring(0, 50) }))
            );
        } else {
            Logger.warn(`getParentVariablesList: session=${this.activeSession ? "defined" : "undefined"}, frameId=${this.activeSession?.activeStackFrameId}`);
        }
        return parentVariableList;
    }
}