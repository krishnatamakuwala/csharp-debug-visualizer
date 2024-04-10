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
    public static readonly editorNotExists = "Editor does not exists!";
    public static readonly customDebugAdapaterNotFound = "Custom Debug Adapter could not b found!";
    public static readonly undefinedSession = "Session is undefined or active stack frame for current session could not be found!";
}

export {
    InformationMessage,
    WarningMessage,
    ErrorMessage
};