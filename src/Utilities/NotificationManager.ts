import { MessageOptions, window } from "vscode";
import { MessageType } from "../Enums/MessageType";

export class NotificationManager {

    /**
     * Show notification message to user
     * @param message Message in format of string
     * @param type Message type as in Information, Warning and Error
     * @param [messageOption=undefined] MessageOptions such as details and modal
     */
    public static showMessage(message: string, type: MessageType, messageOption: MessageOptions | undefined = undefined) {
        switch (type) {
            case MessageType.Information:
                if (messageOption !== undefined) {
                    window.showInformationMessage(message, messageOption);
                } else {
                    window.showInformationMessage(message);
                }
                break;
            case MessageType.Warning:
                if (messageOption !== undefined) {
                    window.showWarningMessage(message, messageOption);
                } else {
                    window.showWarningMessage(message);
                }
                break;
            case MessageType.Error:
                if (messageOption !== undefined) {
                    window.showErrorMessage(message, messageOption);
                } else {
                    window.showErrorMessage(message);
                }
                break;
            default:
                break;
        }
    }
}