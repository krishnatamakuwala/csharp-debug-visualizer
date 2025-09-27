import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./SingleTypeResultProvider";
import { ArrayTypeResultProvider } from "./ArrayTypeResultProvider";

export class DataRowTypeResultProvider implements IResultProvider {

    variableName: string;
    variableList: IVariable[];
    session: DebugSessionDetails;
    commonResultProvider: CommonResultProvider;
    progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;

    constructor(_variableName: string, _variableList: IVariable[], _session: DebugSessionDetails, _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.session = _session;
        this.commonResultProvider = new CommonResultProvider(this.variableName, this.variableList);
        this.progress = _progress;
    }

    async getResult(): Promise<string> {
        const varRef = this.commonResultProvider.getVariableReference();
        var childResponse = await this.session.getVariables(varRef, 0);
        const arrayTypeResultProvider = new ArrayTypeResultProvider(this.variableName, childResponse, this.session, "ItemArray", false, this.progress);
        const result = await arrayTypeResultProvider.getResult();
        return result;
    }
}