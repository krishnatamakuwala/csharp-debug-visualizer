import { TextEditor } from "vscode";
import { Range } from "vscode";

export class Editor {

    /**
     * Get selected variable name based on cursor position
     * @param editor Active editor of current window of vs code
     * @returns Selected variable name as string
     */
    public static getSelectedVariable(editor: TextEditor) {
        const cursorPosition = editor.selection.active;
        var charPosition = cursorPosition.character - 1;
        var previousCharacter = "";
        var startCursorPosition = cursorPosition.character;
        var nextCharacter = "";
        var endCursorPosition = cursorPosition.character;
        var charBreakArray = ['', ' ', '=', '(', ')', '{', '}', '[', ']', '.', ',', ';', '+', '-', '*', '/', '\\', '!', '`', '@', '#', '$', '~', '%', '^', '&', ':', '<', '>', '?', '|', '"', '\''];
        do {
            previousCharacter = editor.document.getText(new Range(cursorPosition.line, charPosition, cursorPosition.line, charPosition + 1));
            if(charBreakArray.includes(previousCharacter)) {
                break;
            }
            startCursorPosition = charPosition;
            charPosition--;
        } while(!charBreakArray.includes(previousCharacter));
        var charPosition = cursorPosition.character + 1;
        do {
            nextCharacter = editor.document.getText(new Range(cursorPosition.line, charPosition, cursorPosition.line, charPosition - 1));
            if(charBreakArray.includes(nextCharacter)) {
                break;
            }
            endCursorPosition = charPosition;
            charPosition++;
        } while(!charBreakArray.includes(nextCharacter));

        return editor.document.getText(new Range(cursorPosition.line, startCursorPosition, cursorPosition.line, endCursorPosition));
    }

    /**
     * Remove leading and trailling {} or ""
     * @param str Input string
     * @returns Lead and trail removed string
     */
    public static getCustomParsedString(str: string) {
        if((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("\"") && str.endsWith("\"")))
        {
            str = str.slice(1, -1);
        }
        return str;
    }
}