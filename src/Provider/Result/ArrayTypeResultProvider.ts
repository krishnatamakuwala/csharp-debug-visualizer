import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";

export class ArrayTypeResultProvider implements IResultProvider {

    variableName: string;
    variableList: IVariable[];
    session: DebugSessionDetails;
    childVarName: string | null;
    isEnumerable: boolean;
    progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    commonResultProvider: CommonResultProvider;

    constructor(_variableName: string, _variableList: IVariable[], _session: DebugSessionDetails, _childVarName: string | null, _isEnumerable: boolean, _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.session = _session;
        this.childVarName = _childVarName;
        this.isEnumerable = _isEnumerable;
        this.progress = _progress;
        this.commonResultProvider = new CommonResultProvider(this.variableName, this.variableList, this.childVarName);
    }

    async getResult(): Promise<string> {
        const varRef = this.commonResultProvider.getVariableReference();
        const result = await this.getArrayVariableResult(varRef);
        return result;
    }

    /**
     * Get elements of an array type variable
     * @param variablesReference Variable reference for child elements
     */
    private async getArrayVariableResult(variablesReference: number): Promise<string> {
        let countPerPage = this.childVarName !== null ? 10 : 20;
        let childCount = await this.commonResultProvider.getCountOfChild(this.session, this.isEnumerable);
        let currentPage = 0;
        let totalPage = Math.ceil(childCount / countPerPage);
        let result: string = "";
        while (currentPage + 1 <= totalPage) {
            var varResult = (await this.session.getVariables(variablesReference, (currentPage * countPerPage), countPerPage)).map(x => { return x.value; });
            if (currentPage + 1 !== totalPage) {
                varResult.pop(); // Remove appended unnesecary element from array
            }
            result = result + (currentPage === 0 ? "" : ", ") + varResult.join(", ");

            this.progress.report({ increment: 50 / totalPage });
            ProgressTracker.progress = ProgressTracker.progress + (50 / totalPage);

            currentPage++;
        }
        return result;
    }
}