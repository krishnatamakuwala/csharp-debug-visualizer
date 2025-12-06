import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { before } from "mocha";
import { createMockCancellationToken } from "../Mocks/MockCancellationToken";
import { createMockDebugSession } from "../Mocks/MockDebugSession";
import { createMockVariable } from "../Mocks/MockVariable";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { DataColumnTypeResultProvider } from "../../Provider/Result/DataColumnTypeResultProvider";
import { ValueNotFoundError } from "../../Extensions/Errors";
import { RequestStatusType } from "../../Enums/RequestStatusType";

describe("DataColumn type variable tests", () => {

    let variableList: IVariable[];
    let cancellationToken: sinon.SinonStub<any[], any>;
    let mockSession;
    let debugSessionDetails: DebugSessionDetails;

    before(() => {
        vscode.window.showInformationMessage("Start all tests.");
    });

    beforeEach(() => {
        ProgressTracker.progress = 0;
        variableList = [
            createMockVariable("testVar", "{Name}", 1001),
            createMockVariable("testVar2", "test", 1002, "testVar.testVar2")
        ];
        mockSession = createMockDebugSession();
        cancellationToken = createMockCancellationToken();
        debugSessionDetails = new DebugSessionDetails(mockSession);

        (mockSession.customRequest as sinon.SinonStub)
            .onFirstCall().resolves({
                variables: [
                    createMockVariable("ColumnName [string]", "\"Name\"", 1003, "testVar.ColumnName"),
                    createMockVariable("DataType [Type]", "{System.Int32}", 1003, "testVar.DataType")
                ]
            });
    });

    it("should return value when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        const provider = new DataColumnTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.be.equal("\"Name\"; System.Int32");
        expect(result).to.be.a("string");
        expect(cancellationToken.callCount).to.be.equal(3);
    });

    it("should not return value when it does not exist and request is not cancelled", async () => {
        const variableName = "nameColumn";
        const provider = new DataColumnTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            cancellationToken
        );
        provider.getResult().catch((e) => {
            expect(e).to.be.an.instanceOf(ValueNotFoundError, "The value for the requested variable could not be found.");
            expect(cancellationToken.callCount).to.be.equal(1);
        });
    });

    it("should not return value when request is cancelled", async () => {
        const variableName = "testVar";
        cancellationToken.onSecondCall().returns(true);
        const provider = new DataColumnTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.be.equal(RequestStatusType.cancelled);
        expect(cancellationToken.callCount).to.be.equal(2);
    });
});