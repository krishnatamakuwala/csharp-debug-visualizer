import { SinonStub } from "sinon";
import { IVariable } from "../../debug/debugSession";
import { createMockVariable } from "./MockVariable";

export function mockArrayPaging(sessionStub: SinonStub, count: number, countPerPage: number, variablesArr: IVariable[], arrayType: ArrayType = ArrayType.array) {
    const totalPage = Math.ceil(count / countPerPage);

    if (arrayType === ArrayType.dataRow) {
        sessionStub
            .onFirstCall()
            .resolves({
                variables: [
                    createMockVariable("HasErrors [bool]", "false", 1003, "testVar.HasErrors"),
                    createMockVariable("ItemArray [object[]]", "{object[33]}", 1004, "testVar.ItemArray")
                ]
            })
            .onSecondCall()
            .resolves({ result: count.toString(), variablesReference: 1001 });
    } else {
        sessionStub
        .onFirstCall()
            .resolves({ result: count.toString(), variablesReference: 1001 });
    }

    for (let i = 1; i <= totalPage; i++) {
        const startNumber =
            variablesArr[((i - 1) * countPerPage) + (i - 2)] !== undefined && variablesArr[((i - 1) * countPerPage) + (i - 2)].value === ""
                ? (countPerPage * (i - 1)) + (i - 1)
                : countPerPage * (i - 1);
        const endNumber =
            variablesArr[(i * countPerPage) + (i - 1)] !== undefined && variablesArr[(i * countPerPage) + (i - 1)].value === ""
                ? startNumber + countPerPage + 1
                : startNumber + countPerPage;

        const variables = variablesArr.slice(startNumber, endNumber);

        if (arrayType === ArrayType.list && i === totalPage) {
            variables.push(createMockVariable(`x[blank]`, "", 1003, `testVar[blank]`));
        }

        sessionStub
            .onCall(arrayType === ArrayType.dataRow ? i + 1 : i)
            .resolves({
                variables: variables
            });
    }

    return totalPage;
}

export enum ArrayType {
    array,
    dataRow,
    list
}