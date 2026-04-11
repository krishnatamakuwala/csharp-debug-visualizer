import { Progress } from "vscode";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { IResultProvider } from "./IResultProvider";
import { ArrayTypeResultProvider } from "./arrayTypeProvider";
import { ProviderResult, success, cancelled, isSuccess } from "../types/result";

export class GenericListTypeResultProvider implements IResultProvider {

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
        const arrayResultProvider = new ArrayTypeResultProvider(this._variableName, this._variableList, this._session, null, true, this._progress, this._cancellationToken);
        const result = await arrayResultProvider.getResult();
        if (!isSuccess(result)) {
            return cancelled();
        }
        return success(result.data.toString());
    }
}