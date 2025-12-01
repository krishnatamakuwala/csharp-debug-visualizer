import * as sinon from "sinon";
import { DebugSession } from "vscode";

export function createMockDebugSession(): DebugSession {
    return {
        customRequest: sinon.stub()
    } as unknown as DebugSession;
}
