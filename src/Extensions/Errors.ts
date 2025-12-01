import { ErrorMessage } from "../Enums/Message";

class BaseError extends Error {
    
    public errorCode: string;

    constructor(message: string, customName: string, errorCode: string = "CE000") {
        super(message);
        this.name = customName;
        this.errorCode = errorCode;
    }
}

export class EditorNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.editorNotFound, "EditorNotFoundError", "CE001");
    }
}

export class UndefinedSessionError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.undefinedSession, "UndefinedSessionError", "CE002");
    }
}

export class InvalidThemeError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidTheme, "InvalidThemeError", "CE003");
    }
}

export class InvalidRecordsPerPageError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.invalidRecordsPerPage, "InvalidRecordsPerPageError", "CE004");
    }
}

export class ValueNotFoundError extends BaseError {
    constructor(message?: string) {
        super(message ?? ErrorMessage.valueNotFound, "ValueNotFoundError", "CE005");
    }
}