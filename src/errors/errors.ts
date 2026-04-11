import { ErrorMessage } from "../constants/messages";
import {
    ERROR_CODE_BASE,
    ERROR_CODE_EDITOR_NOT_FOUND,
    ERROR_CODE_UNDEFINED_SESSION,
    ERROR_CODE_INVALID_THEME,
    ERROR_CODE_INVALID_RECORDS_PER_PAGE,
    ERROR_CODE_VALUE_NOT_FOUND,
    ERROR_CODE_PROVIDER
} from "../constants/errorCodes";

/**
 * Base Error with error code
 */
class BaseError extends Error {

    public errorCode: string;

    constructor(message: string, customName: string, errorCode: string = ERROR_CODE_BASE) {
        super(message);
        this.name = customName;
        this.errorCode = errorCode;
        this.message = this.errorCode + ": " + this.message;
    }
}

/**
 * EditorNotFoundError
 */
class EditorNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.editorNotFound, "EditorNotFoundError", ERROR_CODE_EDITOR_NOT_FOUND);
    }
}

/**
 * UndefinedSessionError
 */
class UndefinedSessionError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.undefinedSession, "UndefinedSessionError", ERROR_CODE_UNDEFINED_SESSION);
    }
}

/**
 * InvalidThemeError
 */
class InvalidThemeError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidTheme, "InvalidThemeError", ERROR_CODE_INVALID_THEME);
    }
}

/**
 * InvalidRecordsPerPageError
 */
class InvalidRecordsPerPageError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidRecordsPerPage, "InvalidRecordsPerPageError", ERROR_CODE_INVALID_RECORDS_PER_PAGE);
    }
}

/**
 * ValueNotFoundError
 */
class ValueNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.valueNotFound, "ValueNotFoundError", ERROR_CODE_VALUE_NOT_FOUND);
    }
}

/**
 * ProviderError — wraps errors from data providers with context
 */
class ProviderError extends BaseError {
    public readonly providerName: string;
    public readonly cause?: Error;

    constructor(providerName: string, message?: string, cause?: Error) {
        super(
            message ?? `Provider "${providerName}" failed.`,
            "ProviderError",
            ERROR_CODE_PROVIDER
        );
        this.providerName = providerName;
        this.cause = cause;
    }
}

export {
    BaseError,
    EditorNotFoundError,
    InvalidRecordsPerPageError,
    InvalidThemeError,
    UndefinedSessionError,
    ValueNotFoundError,
    ProviderError
}