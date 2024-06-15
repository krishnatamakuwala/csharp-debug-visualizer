import { debug, DebugSession, DebugSessionCustomEvent } from "vscode";
import { DebugSessionDetails } from "./DebugSessionDetails";

export class DebugProxy {
    private readonly sessions = new Map<DebugSession, DebugSessionDetails>();

    /**
     * If session details exists, then return existing else return new session details
     * @param session Session
     * @returns Details of particular session
     */
    public getDebugSessionDetails(session: DebugSession): DebugSessionDetails {
        let result = this.sessions.get(session);
        if (!result) {
            result = new DebugSessionDetails(session);
            this.sessions.set(session, result);
        }
        return result;
    }

    constructor() {
        if (debug.activeDebugSession) {
            this.getDebugSessionDetails(debug.activeDebugSession);
        }

        debug.onDidStartDebugSession(session => {
            return this.getDebugSessionDetails(session);
        });

        debug.onDidTerminateDebugSession(session => {
            this.sessions.delete(session);
        });
    }
}