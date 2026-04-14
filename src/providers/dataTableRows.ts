import { Progress } from "vscode";
import { DataTableConfig, Rows } from "../models/Variable";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { RequestStatusType } from "../constants/requestStatus";
import { Configuration } from "../config/configuration";
import { Validator } from "../utilities/Validator";
import { ROW_BATCH_SIZE, PROGRESS_ROWS } from "../constants/pagination";

export interface RowsConfig {
    rows: Rows;
    dataTableConfig: DataTableConfig;
}

export type OnBatchReady = (rows: string[][], startIndex: number) => void;

/**
 * Handles DataTable row retrieval with pagination and batch processing
 */
export class DataTableRowRetriever {

    constructor(
        private _variableName: string,
        private _session: DebugSessionDetails,
        private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>,
        private _cancellationToken: () => boolean,
        private _dataTableConfig: DataTableConfig | null,
        private _getChildCount: (childResult: IVariable[], childType: string) => Promise<number | RequestStatusType.cancelled>,
        private _getChildList: (childResult: IVariable[], childType: string, totalProgress: number, count: number | null, index: number | null) => Promise<string[] | RequestStatusType.cancelled>,
        private _onBatchReady: OnBatchReady | null = null
    ) {}

    /**
     * Get rows with pagination
     * @param dtResult DataTable child variable result
     * @returns Rows with pagination config
     */
    async getRows(dtResult: IVariable[]): Promise<RowsConfig | RequestStatusType.cancelled> {
        let rowList: string[][] | RequestStatusType.cancelled = [];
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }

        const commonResultProvider = new CommonResultProvider(this._variableName, dtResult, "Rows");
        const childVarRef = commonResultProvider.getVariableReference();
        const childResult = await this._session.getVariables(childVarRef, 0);

        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }

        const count = await this._getChildCount(childResult, "Rows");
        if (count === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        let currentPage = this._dataTableConfig?.currentPage ?? 1;
        let recordsPerPage = this._dataTableConfig?.recordsPerPage ?? Configuration.recordsPerPage;
        const validatedRecordsPerPage = Validator.validateRecordsPerPage(recordsPerPage === 0 ? "All" : recordsPerPage.toString());
        recordsPerPage = validatedRecordsPerPage === 0 ? count : validatedRecordsPerPage;
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
        const rowsOnPage = Math.min(recordsPerPage, count - ((currentPage - 1) * recordsPerPage));
        const progressPerRow = PROGRESS_ROWS / rowsOnPage;
        for (let i = 0; i < rowsOnPage; i += ROW_BATCH_SIZE) {
            const batch = Array.from({ length: Math.min(ROW_BATCH_SIZE, rowsOnPage - i) }, (_, j) => i + j);

            const batchResult: (RequestStatusType.cancelled | string[])[] = await Promise.all(
                batch.map(k => this._getChildList(childResult, "Rows", progressPerRow, null, ((currentPage - 1) * recordsPerPage) + k))
            );

            if (batchResult.includes(RequestStatusType.cancelled)) {
                return RequestStatusType.cancelled;
            }
            const batchRows = batchResult as string[][];
            if (this._onBatchReady) {
                this._onBatchReady(batchRows, rowList.length);
            }
            rowList.push(...batchRows);
        }
        return {
            rows: {
                count: count,
                list: rowList
            },
            dataTableConfig: {
                currentPage: currentPage,
                recordsPerPage: validatedRecordsPerPage,
                totalPage: totalPage
            }
        };
    }
}
