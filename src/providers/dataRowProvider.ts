import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ArrayTypeResultProvider } from "./arrayTypeProvider";
import { ProviderResult, cancelled } from "../types/result";

export class DataRowTypeResultProvider implements IResultProvider {

    constructor(
        private _variableName: string,
        private _variableList: IVariable[],
        private _session: DebugSessionDetails,
        private _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>,
        private _cancellationToken: () => boolean
    ) {}

    async getResult(): Promise<ProviderResult<string>> {
        if (this._cancellationToken()) {
            return cancelled();
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList);
        const varRef = commonResultProvider.getVariableReference();
        const childResponse = await this._session.getVariables(varRef, 0);
        const arrayProvider = new ArrayTypeResultProvider(this._variableName, childResponse, this._session, "ItemArray", false, this._progress, this._cancellationToken);
        return await arrayProvider.getResult();
    }
}
