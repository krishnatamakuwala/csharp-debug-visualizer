import { TextEditor } from "vscode";
import { Range } from "vscode";

/** Matches a valid C# identifier (including dotted paths like foo.bar.baz) */
const VALID_CSHARP_IDENTIFIER = /^[a-zA-Z_@][a-zA-Z0-9_]*(\.[a-zA-Z_@][a-zA-Z0-9_]*)*$/;

export class Editor {

    /**
     * Validate that a variable name is a safe C# identifier before DAP expression evaluation.
     * Prevents expression injection via malformed selections.
     * @param varName The variable name to validate
     * @returns true if the name is a valid C# identifier or dotted path
     */
    public static isValidVariableName(varName: string): boolean {
        return VALID_CSHARP_IDENTIFIER.test(varName);
    }

    /**
     * Get selected variable name based on cursor position
     * @param editor Active editor of current window of vs code
     * @returns Selected variable name as string
     */
    public static getSelectedVariable(editor: TextEditor) {
        const cursorPosition = editor.selection.active;
        let charPosition = cursorPosition.character - 1;
        let previousCharacter = "";
        let startCursorPosition = cursorPosition.character;
        let nextCharacter = "";
        let endCursorPosition = cursorPosition.character;
        const charBreakArray = ['', ' ', '=', '(', ')', '{', '}', '[', ']', '.', ',', ';', '+', '-', '*', '/', '\\', '!', '`', '@', '#', '$', '~', '%', '^', '&', ':', '<', '>', '?', '|', '"', '\''];
        do {
            previousCharacter = editor.document.getText(new Range(cursorPosition.line, charPosition, cursorPosition.line, charPosition + 1));
            if(charBreakArray.includes(previousCharacter)) {
                break;
            }
            startCursorPosition = charPosition;
            charPosition--;
        } while(!charBreakArray.includes(previousCharacter));
        charPosition = cursorPosition.character + 1;
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
}
