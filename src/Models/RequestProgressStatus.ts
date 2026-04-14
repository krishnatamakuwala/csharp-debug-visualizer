import { RequestStatusType } from "../constants/requestStatus";

/**
 * Maintain request status based on Request Status Type
 */
class RequestStatus {
    private static _status: RequestStatusType;

    private static readonly terminalStatuses = [RequestStatusType.completed, RequestStatusType.failed, RequestStatusType.cancelled];

    public static get status(): RequestStatusType {
        return this._status;
    }
    public static set status(value: RequestStatusType) {
        if (this._status !== undefined && this.terminalStatuses.includes(this._status) && value !== RequestStatusType.started) {
            return;
        }
        this._status = value;
    }
}

/**
 * Maintain current progress track
 */
class ProgressTracker {
    private static _progress: number;

    public static get progress(): number {
        return this._progress;
    }
    public static set progress(value: number) {
        this._progress = value;
    }
}

export {
    RequestStatus,
    ProgressTracker
};