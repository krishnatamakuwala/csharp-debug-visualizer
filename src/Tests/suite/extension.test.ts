// You can import and use all API from the "vscode" module
// as well as import your extension to test it
import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import { SingleTypeResultProvider } from "../../providers/singleTypeProvider";
import { IVariable } from "../../debug/debugSession";
import { RequestStatusType } from "../../constants/requestStatus";
import { ValueNotFoundError } from "../../errors/errors";
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

		expect(result).to.deep.equal({ status: "success", data: "42" });
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
		try {
			await provider.getResult();
			expect.fail("Expected ValueNotFoundError to be thrown");
		} catch (e) {
			expect(e).to.be.an.instanceOf(ValueNotFoundError);
		}
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

		expect(result).to.deep.equal({ status: "cancelled" });
		expect(cancellationToken.calledOnce).to.be.true;
	});
});
