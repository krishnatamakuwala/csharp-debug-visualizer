import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./SingleTypeResultProvider";
import { Editor } from "../../Utilities/Editor";
import { RequestStatusType } from "../../Enums/RequestStatusType";

export class DataColumnTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _session: DebugSessionDetails;
    _commonResultProvider: CommonResultProvider;
    _isColumnTypeIncluded: boolean;
    _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, cancellationToken: () => boolean, isColumnTypeIncluded: boolean = true) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        this._isColumnTypeIncluded = isColumnTypeIncluded;
        this._cancellationToken = cancellationToken;
    }

    /**
     * Get result for datacolumn type variable
     * @returns Variable Result
     */
    async getResult(): Promise<string | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const varRef = this._commonResultProvider.getVariableReference();
        var childResponse = await this._session.getVariables(varRef, 0);
        const singleTypeResultProvider = new SingleTypeResultProvider(this._variableName, childResponse, "ColumnName", this._cancellationToken);
        const nameResult = await singleTypeResultProvider.getResult();
        if (nameResult === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        let result = nameResult;
        if (this._isColumnTypeIncluded) {
            singleTypeResultProvider._childName = "DataType";
            const typeResult = await singleTypeResultProvider.getResult();
            if (typeResult === RequestStatusType.cancelled) {
                return RequestStatusType.cancelled;
            }
            result = `${nameResult}; ${Editor.removeLeadingAndTrailingCBraces(typeResult)}`;
        }
        return result;
    }
}