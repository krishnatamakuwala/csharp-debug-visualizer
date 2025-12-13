import { ErrorMessage } from "../Enums/Message";

/**
 * Base Error with error code
 */
class BaseError extends Error {
    
    public errorCode: string;

    constructor(message: string, customName: string, errorCode: string = "CE000") {
        super(message);
        this.name = customName;
        this.errorCode = errorCode;
        this.message = this.errorCode + ": " + this.message;
    }
}

/**
 * EditorNotFoundError
 * @message CE001: The requested editor instance does not exist.
 */
class EditorNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.editorNotFound, "EditorNotFoundError", "CE001");
    }
}

/**
 * UndefinedSessionError
 * @message CE002: The session is undefined or no active stack frame could be found for the current session.
 */
class UndefinedSessionError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.undefinedSession, "UndefinedSessionError", "CE002");
    }
}

/**
 * InvalidThemeError
 * @message CE003: The theme configuration provided is invalid.
 */
class InvalidThemeError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidTheme, "InvalidThemeError", "CE003");
    }
}

/**
 * InvalidRecordsPerPageError
 * @message CE004: The records-per-page configuration provided is invalid.
 */
class InvalidRecordsPerPageError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidRecordsPerPage, "InvalidRecordsPerPageError", "CE004");
    }
}

/**
 * ValueNotFoundError
 * @message CE005: The value for the requested variable could not be found.
 */
class ValueNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.valueNotFound, "ValueNotFoundError", "CE005");
    }
}

export {
    BaseError,
    EditorNotFoundError,
    InvalidRecordsPerPageError,
    InvalidThemeError,
    UndefinedSessionError,
    ValueNotFoundError
}