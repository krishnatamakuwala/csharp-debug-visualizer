import { RequestStatusType } from "../Enums/RequestStatusType";

/**
 * Maintain request status based on Request Status Type
 */
export class RequestStatus {
    private static _status: RequestStatusType;

    public static get status(): RequestStatusType {
        return this._status;
    }
    public static set status(value: RequestStatusType) {
        this._status = value;
    }
}

/**
 * Maintain current progress track
 */
export class ProgressTracker {
    private static _progress: number;

    public static get progress(): number {
        return this._progress;
    }
    public static set progress(value: number) {
        this._progress = value;
    }
}