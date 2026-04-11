/**
 * Notification message type
 */
export const enum MessageType {
    information = 1,
    warning = 2,
    error = 3
}

/**
 * Information messages
 */
export class InformationMessage {
    public static readonly visualizing = "Visualizing";
    public static readonly visualized = "Visualized";
}

/**
 * Warning messages
 */
export class WarningMessage {
    public static readonly cancelled = "Request Cancelled";
}

/**
 * Error messages
 */
export class ErrorMessage {
    public static readonly editorNotFound = "The requested editor instance does not exist.";
    public static readonly undefinedSession = "The session is undefined or no active stack frame could be found for the current session.";
    public static readonly invalidTheme = "The theme configuration provided is invalid.";
    public static readonly invalidRecordsPerPage = "The records-per-page configuration provided is invalid.";
    public static readonly valueNotFound = "The value for the requested variable could not be found.";
}
