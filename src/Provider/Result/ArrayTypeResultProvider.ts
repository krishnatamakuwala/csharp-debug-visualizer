import { Progress } from "vscode";
import { ProgressTracker } from "../../Models/RequestProgressStatus";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { RequestStatusType } from "../../Enums/RequestStatusType";

export class ArrayTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _session: DebugSessionDetails;
    _childVarName: string | null;
    _isEnumerable: boolean;
    _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    _count: number | null;
    _variableReference: number | null;
    _totalProgress: number;
    _cancellationToken: () => boolean;
    _commonResultProvider: CommonResultProvider;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, childVarName: string | null, isEnumerable: boolean, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, cancellationToken: () => boolean, count: number | null = null, variableReference: number | null = null, totalProgress: number = 50) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._childVarName = childVarName;
        this._isEnumerable = isEnumerable;
        this._progress = progress;
        this._commonResultProvider = new CommonResultProvider(this._variableName, this._variableList, this._childVarName);
        this._count = count;
        this._variableReference = variableReference;
        if (totalProgress > 80) {
            throw new Error("Total progress can not be more than 80 in array type variables.");
        }
        this._totalProgress = totalProgress;
        this._cancellationToken = cancellationToken;
    }

    async getResult(): Promise<string | RequestStatusType.cancelled> {
        let varRef;
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        if (!this._variableReference) {
            varRef = this._commonResultProvider.getVariableReference();
        } else {
            varRef = this._variableReference;
        }
        const result = await this.getArrayVariableResult(varRef);
        return result;
    }

    /**
     * Get elements of an array type variable
     * @param variablesReference Variable reference for child elements
     */
    private async getArrayVariableResult(variablesReference: number): Promise<string | RequestStatusType.cancelled> {
        let countPerPage = this._childVarName !== null ? 10 : 20;
        let childCount = this._count ?? await this._commonResultProvider.getCountOfChild(this._session, this._isEnumerable);
        let currentPage = 0;
        let totalPage = Math.ceil(childCount / countPerPage);
        let result: string = "";
        while (currentPage + 1 <= totalPage) {
            if (this._cancellationToken()) {
                return RequestStatusType.cancelled;
            }
            var varResult = (await this._session.getVariables(variablesReference, (currentPage * countPerPage), countPerPage)).map(x => { return x.value; });
            if (currentPage + 1 !== totalPage || this._isEnumerable) {
                varResult.pop(); // Remove appended unnesecary empty element from an array
            }
            result = result + (currentPage === 0 ? "" : ", ") + varResult.join(", ");

            this._progress.report({ increment: this._totalProgress / totalPage });
            ProgressTracker.progress = ProgressTracker.progress + (this._totalProgress / totalPage);

            currentPage++;
        }
        return result;
    }
}