import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { SingleTypeResultProvider } from "./singleTypeProvider";
import { ArrayTypeResultProvider } from "./arrayTypeProvider";
import { StringUtils } from "../utilities/StringUtils";
import { RequestStatusType } from "../constants/requestStatus";
import { isSuccess } from "../types/result";
import { Progress } from "vscode";

/**
 * Shared helper methods for DataTable column/row resolution.
 * Extracted from DataTableTypeResultProvider for single-responsibility.
 */
export class DataTableHelpers {

    private _rowChildCount: number | null = null;

    constructor(
        private _variableName: string,
        private _session: DebugSessionDetails,
        private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>,
        private _cancellationToken: () => boolean
    ) {}

    get rowChildCount(): number | null {
        return this._rowChildCount;
    }

    set rowChildCount(value: number | null) {
        this._rowChildCount = value;
    }

    getTableName(dtResult: IVariable[]): string {
        const provider = new CommonResultProvider(this._variableName, dtResult, "TableName", true);
        return provider.getValue() as string;
    }

    async getChildCount(childResult: IVariable[], dataTableChildType: string): Promise<number | RequestStatusType.cancelled> {
        const childName = dataTableChildType + ".Count";
        const provider = new SingleTypeResultProvider(this._variableName, childResult, childName, this._cancellationToken);
        const result = await provider.getResult();
        if (!isSuccess(result)) {
            return RequestStatusType.cancelled;
        }
        return parseInt(result.data);
    }

    async getChildList(childResult: IVariable[], dataTableChildType: string, totalProgress: number, count: number | null = null, index: number | null = null): Promise<string[] | RequestStatusType.cancelled> {
        let childName = dataTableChildType + ".List";
        let varRef: number | null = null;
        let isEnumerable = true;
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        if (dataTableChildType === "Rows") {
            childName = dataTableChildType + "[" + index + "].ItemArray";
            varRef = (await this._session.evaluateExpression(this._variableName + "." + childName, "variables")).variablesReference;
            isEnumerable = false;
        }
        const arrayProvider = new ArrayTypeResultProvider(this._variableName, childResult, this._session, childName, isEnumerable, this._progress, this._cancellationToken, count, varRef, totalProgress);
        const result = await arrayProvider.getResult();
        if (!isSuccess(result)) {
            return RequestStatusType.cancelled;
        }
        if (dataTableChildType === "Rows" && this._rowChildCount === null) {
            this._rowChildCount = result.data.length;
        }
        return result.data.split(", ").map((str: string) => StringUtils.removeLeadingAndTrailingCBraces(str));
    }
}
