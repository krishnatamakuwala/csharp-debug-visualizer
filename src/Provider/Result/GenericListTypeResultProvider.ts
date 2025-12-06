import { DebugSession, Progress } from "vscode";
import { RequestStatusType } from "../../Enums/RequestStatusType";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";
import { CommonResultProvider } from "./CommonResultProvider";
import { IResultProvider } from "./IResultProvider";
import { ArrayTypeResultProvider } from "./ArrayTypeResultProvider";

export class GenericListTypeResultProvider implements IResultProvider {

    _variableName: string;
    _variableList: IVariable[];
    _session: DebugSessionDetails;
    _progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>;
    _cancellationToken: () => boolean;

    constructor(variableName: string, variableList: IVariable[], session: DebugSessionDetails, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, cancellationToken: () => boolean) {
        this._variableName = variableName;
        this._variableList = variableList;
        this._session = session;
        this._progress = progress;
        this._cancellationToken = cancellationToken;
    }

    public async getResult(): Promise<string | RequestStatusType.cancelled> {
        if (this._cancellationToken()) {
            return RequestStatusType.cancelled;
        }
        const arrayResultProvider = new ArrayTypeResultProvider(this._variableName, this._variableList, this._session, null, true, this._progress, this._cancellationToken);
        const result = await arrayResultProvider.getResult();
        if (result === RequestStatusType.cancelled) {
            return RequestStatusType.cancelled;
        }
        return Promise.resolve(result.toString());
    }
}