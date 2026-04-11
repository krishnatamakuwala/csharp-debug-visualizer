import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./singleTypeProvider";
import { StringUtils } from "../utilities/StringUtils";
import { ProviderResult, success, cancelled, isSuccess } from "../types/result";

export class DataColumnTypeResultProvider implements IResultProvider {

    private _variableName: string;
    private _variableList: IVariable[];
    private _session: DebugSessionDetails;
    private _commonResultProvider: CommonResultProvider;
    private _isColumnTypeIncluded: boolean;
    private _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, cancellationToken: () => boolean, isColumnTypeIncluded: boolean = true) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        this._isColumnTypeIncluded = isColumnTypeIncluded;
        this._cancellationToken = cancellationToken;
    }

    async getResult(): Promise<ProviderResult<string>> {
        if (this._cancellationToken()) {
            return cancelled();
        }
        const varRef = this._commonResultProvider.getVariableReference();
        const childResponse = await this._session.getVariables(varRef, 0);
        const nameResult = await new SingleTypeResultProvider(this._variableName, childResponse, "ColumnName", this._cancellationToken).getResult();
        if (!isSuccess(nameResult)) {
            return cancelled();
        }
        let result = nameResult.data;
        if (this._isColumnTypeIncluded) {
            const typeResult = await new SingleTypeResultProvider(this._variableName, childResponse, "DataType", this._cancellationToken).getResult();
            if (!isSuccess(typeResult)) {
                return cancelled();
            }
            result = `${nameResult.data}; ${StringUtils.removeLeadingAndTrailingCBraces(typeResult.data)}`;
        }
        return success(result);
    }
}