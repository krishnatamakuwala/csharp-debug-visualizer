import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ProviderResult, success, cancelled } from "../types/result";

export class ArrayTypeResultProvider implements IResultProvider {

    private _variableName: string;
    private _variableList: IVariable[];
    private _session: DebugSessionDetails;
    private _childVarName: string | null;
    private _isEnumerable: boolean;
    private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    private _count: number | null;
    private _variableReference: number | null;
    private _totalProgress: number;
    private _cancellationToken: () => boolean;
    private _commonResultProvider: CommonResultProvider;

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

    /**
     * Get result for array type variable
     * @returns Variable Result
     */
    async getResult(): Promise<ProviderResult<string>> {
        let varRef;
        if (this._cancellationToken()) {
            return cancelled();
        }
        if (!this._variableReference) {
            varRef = this._commonResultProvider.getVariableReference();
        } else {
            varRef = this._variableReference;
        }
        const result = await this.getArrayVariableResult(varRef);
        if (result === null) {
            return cancelled();
        }
        return success(result);
    }

    private async getArrayVariableResult(variablesReference: number): Promise<string | null> {
        const CHILD_PAGE_SIZE = 10;
        const ROOT_PAGE_SIZE = 20;
        const countPerPage = this._childVarName !== null ? CHILD_PAGE_SIZE : ROOT_PAGE_SIZE;
        let childCount = this._count ?? await this._commonResultProvider.getCountOfChild(this._session, this._isEnumerable);
        let currentPage = 0;
        let totalPage = Math.ceil(childCount / countPerPage);
        let result: string = "";
        while (currentPage + 1 <= totalPage) {
            if (this._cancellationToken()) {
                return null;
            }
            const varResult = (await this._session.getVariables(variablesReference, (currentPage * countPerPage), countPerPage)).map(x => { return x.value; });
            if (currentPage + 1 !== totalPage || this._isEnumerable) {
                varResult.pop(); // Remove appended unnesecary empty element from an array
            }
            result = result + (currentPage === 0 ? "" : ", ") + varResult.join(", ");

            this._progress.report({ increment: this._totalProgress / totalPage });

            currentPage++;
        }
        return result;
    }
}