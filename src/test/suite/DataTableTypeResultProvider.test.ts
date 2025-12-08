// You can import and use all API from the "vscode" module
// as well as import your extension to test it
import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { before } from "mocha";
import { createMockCancellationToken } from "../Mocks/MockCancellationToken";
import { createMockDebugSession } from "../Mocks/MockDebugSession";
import { MockProgress } from "../Mocks/MockProgress";
import { createMockVariable } from "../Mocks/MockVariable";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { DataTableTypeResultProvider } from "../../Provider/Result/DataTableTypeResultProvider";
import { createMockDataTableResult } from "../Mocks/MockDataTableResult";
import { DataTable, DataTableConfig } from "../../Models/Variable";
import { InvalidRecordsPerPageError, ValueNotFoundError } from "../../Extensions/Errors";
import { RequestStatusType } from "../../Enums/RequestStatusType";

describe("DataTable type variable tests", () => {

    let variableList: IVariable[];
    let cancellationToken: sinon.SinonStub<any[], any>;
    let mockSession: vscode.DebugSession;
    let debugSessionDetails: DebugSessionDetails;
    let progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    let recordsPerPage = 10;
    let totalCount = 10;
    let currentPage = 1;
    let expectedResult: DataTable = {
        columns: {
            count: 0,
            list: []
        },
        dataTableConfig: {
            currentPage: 0,
            recordsPerPage: 0,
            totalPage: 0
        },
        rows: {
            count: 0,
            list: []
        },
        tableName: ""
    }

    before(() => {
        vscode.window.showInformationMessage("Start all tests.");
    });

    beforeEach(() => {
        ProgressTracker.progress = 0;
        variableList = [
            createMockVariable("testVar", "{}", 1001),
            createMockVariable("testVar2", "test", 1002, "testVar.testVar2")
        ];
        mockSession = createMockDebugSession();
        cancellationToken = createMockCancellationToken();
        debugSessionDetails = new DebugSessionDetails(mockSession);
        progress = new MockProgress();

        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
    });

    it("should return value when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );
        const result = await provider.getResult();

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }

        expect(result).to.deep.equal(expectedResult);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 3 + (2 + Math.ceil(expectedResult.rows.list[0].length / 10)) * expectedResult.rows.list.length);
        expect(ProgressTracker.progress).to.be.equal(60);
    });

    it("should return value of page 1 with config of 5 records per page when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        mockSession = createMockDebugSession();
        recordsPerPage = 5;
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const config: DataTableConfig = {
            currentPage: currentPage,
            recordsPerPage: recordsPerPage,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        }
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken,
            config
        );
        const result = await provider.getResult();

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }

        expect(result).to.deep.equal(expectedResult);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 3 + (2 + Math.ceil(expectedResult.rows.list[0].length / 10)) * expectedResult.rows.list.length);
        expect(ProgressTracker.progress).to.be.equal(60);
    });

    it("should return value of page 2 with config of 5 records per page when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        mockSession = createMockDebugSession();
        recordsPerPage = 5;
        currentPage = 2;
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const config: DataTableConfig = {
            currentPage: currentPage,
            recordsPerPage: recordsPerPage,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        }
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken,
            config
        );
        const result = await provider.getResult();

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }

        expect(result).to.deep.equal(expectedResult);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 3 + (2 + Math.ceil(expectedResult.rows.list[0].length / 10)) * expectedResult.rows.list.length);
        expect(ProgressTracker.progress).to.be.equal(60);
    });

    it("should return value of page 2 with config of 5 records per page and total count of 7 records when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        mockSession = createMockDebugSession();
        recordsPerPage = 5;
        currentPage = 2;
        totalCount = 7;
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const config: DataTableConfig = {
            currentPage: currentPage,
            recordsPerPage: recordsPerPage,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        }
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken,
            config
        );
        const result = await provider.getResult();

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }

        expect(result).to.deep.equal(expectedResult);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 3 + (2 + Math.ceil(expectedResult.rows.list[0].length / 10)) * expectedResult.rows.list.length);
        expect(ProgressTracker.progress).to.be.equal(60);
    });

    it("should return value of page 1 with config of All records per page and total count of 17 records when it exists and request is not cancelled", async () => {
        const variableName = "testVar";
        mockSession = createMockDebugSession();
        recordsPerPage = 0;
        currentPage = 1;
        totalCount = 17;
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const config: DataTableConfig = {
            currentPage: currentPage,
            recordsPerPage: recordsPerPage,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        }
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken,
            config
        );
        const result = await provider.getResult();

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }

        expect(result).to.deep.equal(expectedResult);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 3 + (2 + Math.ceil(expectedResult.rows.list[0].length / 10)) * expectedResult.rows.list.length);
        expect(Math.round(ProgressTracker.progress)).to.be.equal(60); // Used Math.round function to round negligible decimal progress value because of odd number of total records
    });

    it("should not return value when it does not exists and request is not cancelled", async () => {
        const variableName = "persons";
        mockSession = createMockDebugSession();
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );

        provider.getResult().catch((e) => {
            expect(e).to.be.an.instanceOf(ValueNotFoundError, "CE005: The value for the requested variable could not be found.");
            expect(cancellationToken.callCount).to.be.equal(1);
            expect(ProgressTracker.progress).to.be.equal(0);
        });
    });

    it("should not return value when it exists with invalid configuration and request is not cancelled", async () => {
        const variableName = "persons";
        mockSession = createMockDebugSession();
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const config: DataTableConfig = {
            currentPage: currentPage,
            recordsPerPage: -1,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        }
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken,
            config
        );

        provider.getResult().catch((e) => {
            if (!expectedResult.columns || !expectedResult.rows) {
                throw new Error("Invalid test setup");
            }
            expect(e).to.be.an.instanceOf(InvalidRecordsPerPageError, "CE004: The records-per-page configuration provided is invalid.");
            expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 2);
            expect(ProgressTracker.progress).to.be.equal(15);
        });
    });

    it("should not return value when request is cancelled", async () => {
        const variableName = "testVar";
        cancellationToken.onCall(7).returns(true);
        mockSession = createMockDebugSession();
        expectedResult = createMockDataTableResult(mockSession.customRequest as sinon.SinonStub, totalCount, recordsPerPage, currentPage);
        debugSessionDetails = new DebugSessionDetails(mockSession);
        const provider = new DataTableTypeResultProvider(
            variableName,
            variableList,
            debugSessionDetails,
            progress,
            cancellationToken
        );

        if (!expectedResult.columns || !expectedResult.rows) {
            throw new Error("Invalid test setup");
        }
        const result = await provider.getResult();

        expect(result).to.be.equal(RequestStatusType.cancelled);
        expect(cancellationToken.callCount).to.be.equal(6 + Math.ceil(expectedResult.columns.count / 10) + 1);
        expect(ProgressTracker.progress).to.be.equal(15);
    });
});