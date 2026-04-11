import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ProviderResult, success, cancelled } from "../types/result";
import { Logger } from "../utilities/Logger";
import { ProviderError } from "../errors/errors";

/**
 * Result provider for System.Data.DataSet.
 * Returns a JSON string with table names and count, so the webview can
 * show a table selector. Individual tables are visualized via DataTableTypeResultProvider
 * when the user selects one.
 */
export class DataSetTypeResultProvider implements IResultProvider {

    constructor(
        private _variableName: string,
        private _variableList: IVariable[],
        private _session: DebugSessionDetails,
        private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>,
        private _cancellationToken: () => boolean
    ) {}

    public async getResult(): Promise<ProviderResult<string>> {
        if (this._cancellationToken()) {
            return cancelled();
        }

        try {
            // Get DataSet name
            const nameResult = await this._session.evaluateExpression(
                `${this._variableName}.DataSetName`, "variables"
            );
            const dataSetName = nameResult.result ?? "";

            // Get table count
            const countResult = await this._session.evaluateExpression(
                `${this._variableName}.Tables.Count`, "variables"
            );
            const tableCount = parseInt(countResult.result) || 0;

            Logger.info(`DataSet[${this._variableName}]: name=${dataSetName}, tables=${tableCount}`);

            if (this._cancellationToken()) {
                return cancelled();
            }

            // Get table names
            const tableNames: string[] = [];
            for (let i = 0; i < tableCount; i++) {
                if (this._cancellationToken()) {
                    return cancelled();
                }
                const tableNameResult = await this._session.evaluateExpression(
                    `${this._variableName}.Tables[${i}].TableName`, "variables"
                );
                tableNames.push(tableNameResult.result ?? `Table_${i}`);
                this._progress.report({ increment: 40 / tableCount });
            }

            // Get row counts for each table
            const tableSummaries: { name: string; columns: number; rows: number }[] = [];
            for (let i = 0; i < tableCount; i++) {
                if (this._cancellationToken()) {
                    return cancelled();
                }
                const colCountResult = await this._session.evaluateExpression(
                    `${this._variableName}.Tables[${i}].Columns.Count`, "variables"
                );
                const rowCountResult = await this._session.evaluateExpression(
                    `${this._variableName}.Tables[${i}].Rows.Count`, "variables"
                );
                tableSummaries.push({
                    name: tableNames[i],
                    columns: parseInt(colCountResult.result) || 0,
                    rows: parseInt(rowCountResult.result) || 0
                });
                this._progress.report({ increment: 30 / tableCount });
            }

            return success(JSON.stringify({
                type: "dataset",
                dataSetName,
                tableCount,
                tables: tableSummaries,
                variableName: this._variableName
            }));
        } catch (error) {
            Logger.error(`DataSet[${this._variableName}]: failed`, error);
            throw new ProviderError("DataSet", (error as Error).message, error as Error);
        }
    }
}
