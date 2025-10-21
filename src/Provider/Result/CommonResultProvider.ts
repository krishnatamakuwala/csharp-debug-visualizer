import { ErrorMessage } from "../../Enums/Message";
import { Variable } from "../../Models/Variable";
import { DebugSessionDetails, IVariable } from "../../Proxies/DebugSessionDetails";

export class CommonResultProvider {

    variableName: string;
    variableList: IVariable[];
    childName: string | null;
    matchExactName: boolean;

    constructor(_variableName: string, _variableList: IVariable[], _childName: string | null = null, _matchExactName: boolean = true) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.childName = _childName;
        this.matchExactName = _matchExactName;
    }

    public getVariableReference() {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let varRef: number;
        if (this.matchExactName) {
            varRef = this.variableList.filter(x => x.evaluateName === varName)[0].variablesReference;
        } else {
            varRef = this.variableList.filter(x => x.evaluateName?.includes(varName))[0].variablesReference;
        }
        return varRef;
    }

    /**
     * Get count of child of array or enumerable variable
     * @param session Active session
     * @returns Count of child of array or enumerable variable
     */
    public async getCountOfChild(session: DebugSessionDetails, isEnumerable: boolean): Promise<number> {
        if (session.activeStackFrameId === undefined) {
            throw ErrorMessage.undefinedSession;
        }
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let countFunction = isEnumerable ? "Count" : "Length";
        const count = await session.evaluateExpression(`${varName}.${countFunction}`, session.activeStackFrameId, "variables")
        return parseInt(count.result as string);
    }
}