// You can import and use all API from the "vscode" module
// as well as import your extension to test it
import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import { DebugSessionDetails, IVariable } from "../../debug/debugSession";
import { RequestStatusType } from "../../constants/requestStatus";
import { ValueNotFoundError } from "../../errors/errors";
import { before } from "mocha";
import { createMockCancellationToken } from "../Mocks/MockCancellationToken";
import { DataRowTypeResultProvider } from "../../providers/dataRowProvider";
import { createMockDebugSession } from "../Mocks/MockDebugSession";
import { MockProgress } from "../Mocks/MockProgress";
import { createMockVariable } from "../Mocks/MockVariable";
import { ArrayType, mockArrayPaging } from "../Mocks/MockArrayPaging";
import { buildArrayVariables, buildExpectedResult } from "../Helpers/TestArrayHelper";

describe("DataRow type variable tests", () => {

    let variableList: IVariable[];
    let cancellationToken: sinon.SinonStub<any[], any>;
    let mockSession;
    let debugSessionDetails: DebugSessionDetails;
    let progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    let countPerPage = 10;

    before(() => {
        vscode.window.showInformationMessage("Start all tests.");
    });

    beforeEach(() => {
        variableList = [
            createMockVariable("testVar", "{Syste.Data.DataRow}", 1001),
            createMockVariable("testVar2", "test", 1002, "testVar.testVar2")
        ];
        mockSession = createMockDebugSession();
        cancellationToken = createMockCancellationToken();
        debugSessionDetails = new DebugSessionDetails(mockSession);
        progress = new MockProgress();

        (mockSession.customRequest as sinon.SinonStub)
            .onFirstCall().resolves({
                variables: [
                    createMockVariable("HasErrors [bool]", "false", 1003, "testVar.HasErrors"),
                    createMockVariable("ItemArray [object[]]", "{object[33]}", 1004, "testVar.ItemArray")
                ]
            })
            .onSecondCall().resolves({
                result: "3",
                variablesReference: 1001,
            })
            .onThirdCall().resolves({
                variables: [
                    createMockVariable("x", "10", 1003, "testVar[0]"),
                    createMockVariable("y", "20", 1004, "testVar[1]"),
                    createMockVariable("z", "30", 1005, "testVar[2]")
                ]
            });
    });

    it("should return value when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        const count = 3;
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: "10, 20, 30" });
        expect(cancellationToken.callCount).to.be.equal(2 + (Math.ceil(count / countPerPage)));
    });

    it("should return value when it does not exists and request is not cancelled", async () => {
        const variableName = "persons";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );
        try {
            await provider.getResult();
            expect.fail("Expected ValueNotFoundError to be thrown");
        } catch (e) {
            expect(e).to.be.an.instanceOf(ValueNotFoundError);
            expect(cancellationToken.callCount).to.be.equal(2);
            }
    });

    it("should return empty string as value when it array is empty and request is not cancelled", async () => {
        const _mockSession = createMockDebugSession();
        const _debugSessionDetails = new DebugSessionDetails(_mockSession);
        const count = 0;
        (_mockSession.customRequest as sinon.SinonStub)
            .onFirstCall().resolves({
                variables: [
                    createMockVariable("HasErrors [bool]", "false", 1003, "testVar.HasErrors"),
                    createMockVariable("ItemArray [object[]]", "{object[0]}", 1004, "testVar.ItemArray")
                ]
            })
            .onSecondCall().resolves({
                result: count.toString(),
                variablesReference: 1001,
            })
            .onThirdCall().resolves({
                variables: []
            });
        const variableName = "testVar";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            _debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: "" });
        expect(cancellationToken.callCount).to.be.equal(2 + (Math.ceil(count / countPerPage)));
    });

    it("should not return value when request is cancelled", async () => {
        const variableName = "testVar";
        const count = 3;
        cancellationToken.onThirdCall().returns(true);
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "cancelled" });
        expect(cancellationToken.callCount).to.be.equal(2 + (Math.ceil(count / countPerPage)));
    });

    it("should return full array string as value when it array length is 30 and request is not cancelled", async () => {
        let _mockSession = createMockDebugSession();
        const _debugSessionDetails = new DebugSessionDetails(_mockSession);
        const count = 30;
        const totalPage = mockArrayPaging(
            _mockSession.customRequest as sinon.SinonStub,
            count,
            countPerPage,
            buildArrayVariables(count, countPerPage),
            ArrayType.dataRow
        );
        const variableName = "testVar";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            _debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: buildExpectedResult(count) });
        expect(cancellationToken.callCount).to.be.equal(2 + totalPage);
    });

    it("should return full array string as value when it array length is 20 and request is not cancelled", async () => {
        let _mockSession = createMockDebugSession();
        const _debugSessionDetails = new DebugSessionDetails(_mockSession);
        const count = 20;
        const totalPage = mockArrayPaging(
            _mockSession.customRequest as sinon.SinonStub,
            count,
            countPerPage,
            buildArrayVariables(count, countPerPage),
            ArrayType.dataRow
        );
        const variableName = "testVar";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            _debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: buildExpectedResult(count) });
        expect(cancellationToken.callCount).to.be.equal(2 + totalPage);
    });

    it("should return full array string as value when it array length is 40 and request is not cancelled", async () => {
        let _mockSession = createMockDebugSession();
        const _debugSessionDetails = new DebugSessionDetails(_mockSession);
        const count = 40;
        const totalPage = mockArrayPaging(
            _mockSession.customRequest as sinon.SinonStub,
            count,
            countPerPage,
            buildArrayVariables(count, countPerPage),
            ArrayType.dataRow
        );
        const variableName = "testVar";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            _debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: buildExpectedResult(count) });
        expect(cancellationToken.callCount).to.be.equal(2 + totalPage);
    });

    it("should return full array string as value when it array length is 100 and request is not cancelled", async () => {
        let _mockSession = createMockDebugSession();
        const _debugSessionDetails = new DebugSessionDetails(_mockSession);
        const count = 100;
        const totalPage = mockArrayPaging(
            _mockSession.customRequest as sinon.SinonStub,
            count,
            countPerPage,
            buildArrayVariables(count, countPerPage),
            ArrayType.dataRow
        );
        const variableName = "testVar";
        const provider = new DataRowTypeResultProvider(
            variableName,
            variableList,
            _debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        expect(result).to.deep.equal({ status: "success", data: buildExpectedResult(count) });
        expect(cancellationToken.callCount).to.be.equal(2 + totalPage);
    });
});
