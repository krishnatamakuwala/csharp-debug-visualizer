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

    // public async getActiveStackFrame(session: DebugSession) {
        // const activeSession = this.sessions.get(session.session);
        // if (activeSession !== undefined) {
        //     const threads = await activeSession.getThreads();
        //     const threadId = session.body.threadId;
        //     if (threads.includes(threadId))
        //     {
        //         const activeStackFrame = await activeSession.getStackTrace(threadId, 0, 1);
        //         activeSession._activeStackFrameId = activeStackFrame.stackFrames.length > 0 ? activeStackFrame.stackFrames[0].id : undefined;
        //     }
        // }
    // }

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

        // debug.onDidReceiveDebugSessionCustomEvent(session => {
        //     console.log(session.event);
        //     if(session.event === "stopped") {
        //         // this.getActiveStackFrame(session);
        //     }
        // });
    }
}