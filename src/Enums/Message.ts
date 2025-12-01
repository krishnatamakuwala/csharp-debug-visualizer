/**
 * Class of static information related messages
 */
class InformationMessage {
    public static readonly visualizing = "Visualizing";
    public static readonly visualized = "Visualized";
}

/**
 * Class of static warning related messages
 */
class WarningMessage {
    public static readonly cancelled = "Request Cancelled";
}

/**
 * Class of static error related messages
 */
class ErrorMessage {
    public static readonly editorNotFound = "The requested editor instance does not exist.";
    public static readonly undefinedSession = "The session is undefined or no active stack frame could be found for the current session.";
    public static readonly invalidTheme = "The theme configuration provided is invalid.";
    public static readonly invalidRecordsPerPage = "The records-per-page configuration provided is invalid.";
    public static readonly valueNotFound = "The value for the requested variable could not be found.";
}

export {
    InformationMessage,
    WarningMessage,
    ErrorMessage
};