import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./SingleTypeResultProvider";

export class DataColumnTypeResultProvider implements IResultProvider {

    variableName: string;
    variableList: IVariable[];
    session: DebugSessionDetails;
    commonResultProvider: CommonResultProvider;

    constructor(_variableName: string, _variableList: IVariable[], _session: DebugSessionDetails) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.session = _session;
        this.commonResultProvider = new CommonResultProvider(this.variableName, this.variableList);
    }

    async getResult(): Promise<string> {
        const varRef = this.commonResultProvider.getVariableReference();
        var childResponse = await this.session.getVariables(varRef, 0);
        const singleTypeResultProvider = new SingleTypeResultProvider(this.variableName, childResponse, "ColumnName");
        const nameResult = await singleTypeResultProvider.getResult();
        singleTypeResultProvider.childName = "DataType";
        const typeResult = await singleTypeResultProvider.getResult();
        return `${nameResult}; ${typeResult.slice(1, -1)}`;
    }
}