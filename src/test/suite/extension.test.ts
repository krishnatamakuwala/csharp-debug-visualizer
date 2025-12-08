// You can import and use all API from the "vscode" module
// as well as import your extension to test it
import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import { SingleTypeResultProvider } from "../../Provider/Result/SingleTypeResultProvider";
import { IVariable } from "../../Proxies/DebugSessionDetails";
import { RequestStatusType } from "../../Enums/RequestStatusType";
import { ValueNotFoundError } from "../../Extensions/Errors";
import { before } from "mocha";
import { createMockCancellationToken } from "../Mocks/MockCancellationToken";
import { createMockVariable } from "../Mocks/MockVariable";

describe("Single type variable tests", () => {

	let variableList: IVariable[];
	let cancellationToken: sinon.SinonStub<any[], any>;

	before(() => {
		vscode.window.showInformationMessage("Start all tests.");
		variableList = [
			createMockVariable("testVar", "42", 1001),
			createMockVariable("testVar2", "test", 1002, "testVar.testVar2")
		];
		cancellationToken = createMockCancellationToken();
	});

	it("should return value when it exists and request is not cancelled", async () => {
		const variableName = "testVar";
		const provider = new SingleTypeResultProvider(
			variableName,
			variableList,
			null,
			cancellationToken
		);
		const result = await provider.getResult();

		expect(result).to.be.equal("42");
		expect(result).to.be.a("string");
		expect(cancellationToken.calledOnce).to.be.true;
	});

	it("should not return value when it does not exists and request is not cancelled", async () => {
		const variableName = "persons";
		const provider = new SingleTypeResultProvider(
			variableName,
			variableList,
			null,
			cancellationToken
		);
		provider.getResult().catch((e) => {
			expect(e).to.be.an.instanceOf(ValueNotFoundError, "CE005: The value for the requested variable could not be found.");
			expect(cancellationToken.calledOnce).to.be.true;
		});
	});

	it("should not return value when request is cancelled", async () => {
		const variableName = "testVar";
		const variableList: IVariable[] = [{ name: "testVar", value: "42", evaluateName: "testVar", variablesReference: 1001 }];
		cancellationToken = createMockCancellationToken(true);

		const provider = new SingleTypeResultProvider(
			variableName,
			variableList,
			null,
			cancellationToken
		);
		const result = await provider.getResult();

		expect(result).to.be.equal(RequestStatusType.cancelled);
		expect(cancellationToken.calledOnce).to.be.true;
	});
});
