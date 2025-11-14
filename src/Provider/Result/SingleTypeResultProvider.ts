import { RequestStatusType } from "../../Enums/RequestStatusType";
import { IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";

export class SingleTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _childName: string | null;
    _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], childName: string | null = null, cancellationToken: () => boolean) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._childName = childName;
        this._cancellationToken = cancellationToken;
    }

    public async getResult(): Promise<string | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const commonResultProvider = new CommonResultProvider(this._variableName, this._variableList, this._childName, true);
        return Promise.resolve(commonResultProvider.getValue() as string);
    }
}