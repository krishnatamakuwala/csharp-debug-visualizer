import { SinonStub } from "sinon";
import { IVariable } from "../../Proxies/DebugSessionDetails";

export function mockArrayPaging(sessionStub: SinonStub, count: number, countPerPage: number, variablesArr: IVariable[]) {
    const totalPage = Math.ceil(count / countPerPage);

    sessionStub
        .onFirstCall()
        .resolves({ result: count.toString(), variablesReference: 1001 });

    for (let i = 1; i <= totalPage; i++) {
        const startNumber =
            variablesArr[((i - 1) * countPerPage) + (i - 2)] !== undefined && variablesArr[((i - 1) * countPerPage) + (i - 2)].value === ""
                ? (countPerPage * (i - 1)) + (i - 1)
                : countPerPage * (i - 1);
        const endNumber =
            variablesArr[(i * countPerPage) + (i - 1)] !== undefined && variablesArr[(i * countPerPage) + (i - 1)].value === ""
                ? startNumber + countPerPage + 1
                : startNumber + countPerPage;
        sessionStub
            .onCall(i)
            .resolves({
                variables: variablesArr.slice(startNumber, endNumber)
            });
    }

    return totalPage;
}