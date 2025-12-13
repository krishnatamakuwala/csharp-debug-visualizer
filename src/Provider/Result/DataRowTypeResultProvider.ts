import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./SingleTypeResultProvider";
import { ArrayTypeResultProvider } from "./ArrayTypeResultProvider";
import { RequestStatusType } from "../../Enums/RequestStatusType";

export class DataRowTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _session: DebugSessionDetails;
    _commonResultProvider: CommonResultProvider;
    _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, cancellationToken: () => boolean) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        this._progress = progress;
        this._cancellationToken = cancellationToken;
    }

    /**
     * Get result for datarow type variable
     * @returns Variable Result
     */
    async getResult(): Promise<string | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const varRef = this._commonResultProvider.getVariableReference();
        const childResponse = await this._session.getVariables(varRef, 0);
        const arrayTypeResultProvider = new ArrayTypeResultProvider(this._variableName, childResponse, this._session, "ItemArray", false, this._progress, this._cancellationToken);
        const result = await arrayTypeResultProvider.getResult();
        return result;
    }
}