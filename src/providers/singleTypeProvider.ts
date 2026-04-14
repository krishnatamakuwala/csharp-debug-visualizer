import { IVariable } from "../debug/debugSession";
import { CommonResultProvider } from "./variableLookup";
import { IResultProvider } from "./IResultProvider";
import { ProviderResult, success, cancelled } from "../types/result";

export class SingleTypeResultProvider implements IResultProvider {

    private _variableName: string;
    private _variableList: IVariable[];
    private _childName: string | null;
    private _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], childName: string | null = null, cancellationToken: () => boolean) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._childName = childName;
        this._cancellationToken = cancellationToken;
    }

    public async getResult(): Promise<ProviderResult<string>> {
        if (this._cancellationToken()) {
            return cancelled();
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList, this._childName, true);
        const result = commonResultProvider.getValue();
        return success(result);
    }
}