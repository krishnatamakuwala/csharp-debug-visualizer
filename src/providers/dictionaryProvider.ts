import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ProviderResult, success, cancelled } from "../types/result";
import { Logger } from "../utilities/Logger";
import { ProviderError } from "../errors/errors";

/**
 * Result provider for Dictionary, Hashtable, SortedDictionary, SortedList types.
 * Renders as a key-value pair list: [{ key: "...", value: "..." }, ...]
 */
export class DictionaryTypeResultProvider implements IResultProvider {

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
            const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
            const varRef = commonResultProvider.getVariableReference();

            // Get child variables (entries show as indexed [0], [1], etc.)
            const children = await this._session.getVariables(varRef, 0);
            if (this._cancellationToken()) {
                return cancelled();
            }

            // Get count via expression
            const countResult = await this._session.evaluateExpression(`${this._variableName}.Count`, "variables");
            const count = parseInt(countResult.result) || 0;

            Logger.info(`Dictionary[${this._variableName}]: count=${count}`);

            if (count === 0) {
                return success(JSON.stringify({ type: "dictionary", count: 0, entries: [] }));
            }

            const entries: { key: string; value: string }[] = [];
            const batchSize = 10;

            for (let i = 0; i < count && i < 200; i += batchSize) {
                if (this._cancellationToken()) {
                    return cancelled();
                }

                const batch = Array.from(
                    { length: Math.min(batchSize, count - i) },
                    (_, j) => i + j
                );

                const batchResults = await Promise.all(
                    batch.map(async (idx) => {
                        try {
                            const keyResult = await this._session.evaluateExpression(
                                `${this._variableName}.ElementAt(${idx}).Key`, "variables"
                            );
                            const valueResult = await this._session.evaluateExpression(
                                `${this._variableName}.ElementAt(${idx}).Value`, "variables"
                            );
                            return {
                                key: keyResult.result ?? "?",
                                value: valueResult.result ?? "?"
                            };
                        } catch {
                            // Fallback: try indexed access for Hashtable/SortedList
                            try {
                                const keyResult = await this._session.evaluateExpression(
                                    `new System.Collections.ArrayList(${this._variableName}.Keys)[${idx}]`, "variables"
                                );
                                const valueResult = await this._session.evaluateExpression(
                                    `new System.Collections.ArrayList(${this._variableName}.Values)[${idx}]`, "variables"
                                );
                                return {
                                    key: keyResult.result ?? "?",
                                    value: valueResult.result ?? "?"
                                };
                            } catch {
                                return { key: `[${idx}]`, value: "unable to read" };
                            }
                        }
                    })
                );

                entries.push(...batchResults);
                this._progress.report({ increment: 50 / Math.ceil(count / batchSize) });
            }

            return success(JSON.stringify({ type: "dictionary", count, entries }));
        } catch (error) {
            Logger.error(`Dictionary[${this._variableName}]: failed`, error);
            throw new ProviderError("Dictionary", (error as Error).message, error as Error);
        }
    }
}
