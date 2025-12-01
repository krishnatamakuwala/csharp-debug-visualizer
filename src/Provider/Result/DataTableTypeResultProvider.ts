import { Progress } from "vscode";
import { Columns, DataTable, DataTableConfig, Rows } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { SingleTypeResultProvider } from "./SingleTypeResultProvider";
import { ArrayTypeResultProvider } from "./ArrayTypeResultProvider";
import { Editor } from "../../Utilities/Editor";
import { RequestStatusType } from "../../Enums/RequestStatusType";
import { Configuration } from "../../Models/Configuration";

export class DataTableTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _session: DebugSessionDetails;
    _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    _cancellationToken: () => boolean;
    _dataTableConfig: DataTableConfig | null;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, cancellationToken: () => boolean, dataTableConfig: DataTableConfig | null = null) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._progress = progress;
        this._cancellationToken = cancellationToken;
        this._dataTableConfig = dataTableConfig;
    }

    async getResult(): Promise<DataTable | RequestStatusType.cancelled> {
        const dt: DataTable = {
            tableName: "",
            columns: null,
            rows: null,
            dataTableConfig: null
        };
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        const varRef = commonResultProvider.getVariableReference();
        const dtResult = await this._session.getVariables(varRef, 0);
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }

        const [columns, rowsConfig] = await Promise.all([this.getColumnList(dtResult), this.getRowList(dtResult)]);
        if (columns === RequestStatusType.cancelled || rowsConfig === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        dt.columns = columns;
        dt.rows = rowsConfig.rows;
        dt.tableName = this.getTableName(dtResult);
        dt.dataTableConfig = rowsConfig.dataTableConfig;

        return dt;
    }

    private getTableName(dtResult: IVariable[]): string {
        const commonResultProvider = new CommonResultProvider(this._variableName, dtResult, "TableName", true);
        const tableName = commonResultProvider.getValue();
        return tableName as string;
    }

    private async getColumnList(dtResult: IVariable[]): Promise<Columns | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, dtResult, DataTableChildType.columns);
        const childVarRef = commonResultProvider.getVariableReference();
        const childResult = await this._session.getVariables(childVarRef, 0);

        const childCount: number | RequestStatusType.cancelled = await this.getChildCount(childResult, DataTableChildType.columns);
        if (childCount === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        const childList = await this.getChildList(childResult, DataTableChildType.columns, 15);
        if (childList === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }

        return {
            count: childCount,
            list: childList
        };
    }

    private async getChildCount(childResult: IVariable[], dataTableChildType: DataTableChildType): Promise<number | RequestStatusType.cancelled> {
        const childName = dataTableChildType + "." + "Count";
        const singleResultProvider = new SingleTypeResultProvider(this._variableName, childResult, childName, this._cancellationToken);
        const count = await singleResultProvider.getResult();
        if (count === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        return parseInt(count);
    }

    private async getChildList(childResult: IVariable[], dataTableChildType: DataTableChildType, totalProgress: number, count: number | null = null, index: number | null = null): Promise<string[] | RequestStatusType.cancelled> {
        let childName = dataTableChildType + "." + "List";
        let varRef: number | null = null;
        let isEnumerable = true;
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        if (dataTableChildType === DataTableChildType.rows) {
            childName = dataTableChildType + "[" + index + "]" + "." + "ItemArray";
            varRef = parseInt((await this._session.evaluateExpression(this._variableName + "." + childName, "variables")).variablesReference);
            isEnumerable = false;
        }
        const arrayResultProvider = new ArrayTypeResultProvider(this._variableName, childResult, this._session, childName, isEnumerable, this._progress, this._cancellationToken, count, varRef, totalProgress);
        const childList = await arrayResultProvider.getResult();
        if (childList === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        return childList.split(", ").map((str) => {
            return Editor.removeLeadingAndTrailingCBraces(str);
        });
    }

    private async getRowList(dtResult: IVariable[]): Promise<RowsConfig | RequestStatusType.cancelled> {
        let i = 0;
        let rowList: string[][] | RequestStatusType.cancelled = [];
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }

        const commonResultProvider = new CommonResultProvider(this._variableName, dtResult, DataTableChildType.rows);
        const childVarRef = commonResultProvider.getVariableReference();
        const childResult = await this._session.getVariables(childVarRef, 0);

        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }

        const count = await this.getChildCount(childResult, DataTableChildType.rows);
        let currentPage = this._dataTableConfig?.currentPage ?? 1;
        const recordsPerPage = this._dataTableConfig?.recordsPerPage ?? Configuration.recordsPerPage;
        const totalPage = Math.ceil(count / recordsPerPage);
        if (currentPage % 1 !== 0) {
            currentPage = Math.ceil(currentPage);
        }
        if (currentPage > totalPage) {
            currentPage = totalPage;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }

        if (count === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        const batchSize = 5;
        for (let i = 0; i < Math.min(recordsPerPage, count - ((currentPage - 1) * recordsPerPage)); i += batchSize) {
            const batch = Array.from({ length: Math.min(batchSize, (count - ((currentPage - 1) * recordsPerPage)) - i) }, (_, j) => i + j);
            const batchResult = await Promise.all(
                batch.map(k => this.getChildList(childResult, DataTableChildType.rows, 45 / count, null, ((currentPage - 1) * recordsPerPage) + k))
            );
            if (batchResult.includes(RequestStatusType.cancelled)) {
                return RequestStatusType.cancelled;
            }
            rowList.push(...(batchResult as string[][]));
        }
        return {
            rows: {
                count: count,
                list: rowList
            },
            dataTableConfig: {
                currentPage: currentPage,
                recordsPerPage: recordsPerPage,
                totalPage: totalPage
            }
        };
    }
}

enum DataTableChildType {
    columns = "Columns",
    rows = "Rows"
}

interface RowsConfig {
    rows: Rows,
    dataTableConfig: DataTableConfig
}