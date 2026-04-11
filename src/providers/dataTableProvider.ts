import { Progress } from "vscode";
import { Columns, DataTable, DataTableConfig } from "../models/Variable";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { RequestStatusType } from "../constants/requestStatus";
import { ProviderResult, success, cancelled } from "../types/result";
import { DataTableRowRetriever, RowsConfig, OnBatchReady } from "./dataTableRows";
import { DataTableHelpers } from "./dataTableHelpers";
import { PROGRESS_COLUMNS } from "../constants/pagination";
import { Logger } from "../utilities/Logger";

export type OnHeaderReady = (header: { varName: string; tableName: string; columnCount: number; rowCount: number; columns: string[]; dataTableConfig: DataTableConfig }) => void;

/**
 * Result provider for DataTable type variables.
 * Orchestrates column/row fetching and streaming via helpers.
 */
export class DataTableTypeResultProvider implements IResultProvider {

    private _helpers: DataTableHelpers;

    constructor(
        private _variableName: string,
        private _variableList: IVariable[],
        private _session: DebugSessionDetails,
        private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>,
        private _cancellationToken: () => boolean,
        private _dataTableConfig: DataTableConfig | null = null,
        private _onHeaderReady: OnHeaderReady | null = null,
        private _onBatchReady: OnBatchReady | null = null
    ) {
        this._helpers = new DataTableHelpers(_variableName, _session, _progress, _cancellationToken);
    }

    async getResult(): Promise<ProviderResult<DataTable>> {
        if (this._cancellationToken()) {
            Logger.warn(`DataTable[${this._variableName}]: cancelled before start`);
            return cancelled();
        }

        Logger.info(`DataTable[${this._variableName}]: finding variable in parent list (${this._variableList.length} variables)`);
        const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        const varRef = commonResultProvider.getVariableReference();
        const dtResult = await this._session.getVariables(varRef, 0);
        Logger.info(`DataTable[${this._variableName}]: got ${dtResult.length} child properties`);

        if (this._cancellationToken()) {
            return cancelled();
        }

        // Fetch columns
        const columns = await this.getColumnList(dtResult);
        if (columns === RequestStatusType.cancelled) {
            return cancelled();
        }

        // Send header to webview before rows load
        const tableName = this._helpers.getTableName(dtResult);
        const rowCount = await this._helpers.getChildCount(
            await this._session.getVariables(new CommonResultProvider(this._variableName, dtResult, "Rows").getVariableReference(), 0),
            "Rows"
        );
        if (rowCount === RequestStatusType.cancelled) {
            return cancelled();
        }
        if (this._onHeaderReady) {
            this._onHeaderReady({
                varName: this._variableName,
                tableName,
                columnCount: columns.count,
                rowCount,
                columns: columns.list,
                dataTableConfig: this._dataTableConfig ?? { currentPage: 1, recordsPerPage: 0, totalPage: 0 }
            });
        }

        // Fetch rows with streaming
        const rowRetriever = new DataTableRowRetriever(
            this._variableName, this._session, this._progress, this._cancellationToken, this._dataTableConfig,
            this._helpers.getChildCount.bind(this._helpers),
            this._helpers.getChildList.bind(this._helpers),
            this._onBatchReady
        );
        const rowsConfig = await rowRetriever.getRows(dtResult);
        if (rowsConfig === RequestStatusType.cancelled) {
            return cancelled();
        }

        const dt: DataTable = {
            tableName,
            columns,
            rows: rowsConfig.rows,
            dataTableConfig: rowsConfig.dataTableConfig
        };
        Logger.info(`DataTable[${this._variableName}]: SUCCESS — tableName="${dt.tableName}", columns=${columns.count}, rows=${rowsConfig.rows.count}`);
        return success(dt);
    }

    private async getColumnList(dtResult: IVariable[]): Promise<Columns | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, dtResult, "Columns");
        const childVarRef = commonResultProvider.getVariableReference();
        const childResult = await this._session.getVariables(childVarRef, 0);

        const childCount = await this._helpers.getChildCount(childResult, "Columns");
        if (childCount === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        this._helpers.rowChildCount = childCount;
        const childList = await this._helpers.getChildList(childResult, "Columns", PROGRESS_COLUMNS, childCount);
        if (childList === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        return { count: childCount, list: childList };
    }
}
