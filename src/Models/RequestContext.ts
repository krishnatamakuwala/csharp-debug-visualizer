import { RequestStatusType } from "../constants/requestStatus";

/**
 * Per-request context that replaces the global RequestStatus and ProgressTracker singletons.
 * Each visualization command gets its own RequestContext, preventing state corruption
 * from concurrent requests.
 */
export class RequestContext {
    private _status: RequestStatusType = RequestStatusType.started;
    private _progress: number = 0;

    private static readonly terminalStatuses = [
        RequestStatusType.completed,
        RequestStatusType.failed,
        RequestStatusType.cancelled
    ];

    get status(): RequestStatusType {
        return this._status;
    }

    set status(value: RequestStatusType) {
        if (this._status !== undefined &&
            RequestContext.terminalStatuses.includes(this._status) &&
            value !== RequestStatusType.started) {
            return;
        }
        this._status = value;
    }

    get progress(): number {
        return this._progress;
    }

    set progress(value: number) {
        this._progress = value;
    }

    /**
     * Check if this request has been cancelled
     */
    isCancelled(): boolean {
        return this._status === RequestStatusType.cancelled;
    }
}
