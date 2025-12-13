import * as sinon from "sinon";

export function createMockCancellationToken(initialState = false) {
    return sinon.stub().returns(initialState);
}