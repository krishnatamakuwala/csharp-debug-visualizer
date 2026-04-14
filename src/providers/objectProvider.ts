import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ProviderResult, success, cancelled } from "../types/result";
import { Logger } from "../utilities/Logger";
import { ProviderError } from "../errors/errors";

/**
 * Result provider for custom objects, Tuples, DataView, and other complex types.
 * Displays object properties as name-value pairs.
 */
export class ObjectTypeResultProvider implements IResultProvider {

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

            // Get all child properties
            const children = await this._session.getVariables(varRef, 0);
            if (this._cancellationToken()) {
                return cancelled();
            }

            Logger.info(`Object[${this._variableName}]: ${children.length} properties`);

            const properties: { name: string; value: string }[] = [];

            for (const child of children) {
                // Skip internal debugger entries
                if (child.name === "Static members" || child.name === "[More]") {
                    continue;
                }

                // Extract clean property name (remove type annotation like "Name [string]" → "Name")
                const cleanName = child.name.includes(" [")
                    ? child.name.substring(0, child.name.indexOf(" ["))
                    : child.name;

                properties.push({
                    name: cleanName,
                    value: child.value ?? ""
                });
            }

            this._progress.report({ increment: 50 });

            return success(JSON.stringify({
                type: "object",
                propertyCount: properties.length,
                properties
            }));
        } catch (error) {
            Logger.error(`Object[${this._variableName}]: failed`, error);
            throw new ProviderError("Object", (error as Error).message, error as Error);
        }
    }
}
