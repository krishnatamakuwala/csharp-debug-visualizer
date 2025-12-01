import { ValueNotFoundError } from "../../Extensions/Errors";
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

    /**
     * Get Variable reference
     * @returns Variable reference
     */
    public getVariableReference(): number {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let varRefArr: IVariable[];
        if (this.matchExactName) {
            varRefArr = this.variableList.filter(x => x.evaluateName === varName);
        } else {
            varRefArr = this.variableList.filter(x => x.evaluateName?.includes(varName));
        }

        if (!varRefArr || !varRefArr[0]) {
            throw new ValueNotFoundError();
        }
        return varRefArr[0].variablesReference;
    }

    /**
     * Get value by evaluate name
     */
    public getValue(): string {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let valueArr: IVariable[];
        if (this.matchExactName) {
            valueArr = this.variableList.filter(x => x.evaluateName === varName);
        } else {
            valueArr = this.variableList.filter(x => x.evaluateName?.includes(varName));
        }

        if (!valueArr || !valueArr[0]) {
            throw new ValueNotFoundError();
        }
        return valueArr[0].value;
    }

    /**
     * Get count of child of array or enumerable variable
     * @param session Active session
     * @returns Count of child of array or enumerable variable
     */
    public async getCountOfChild(session: DebugSessionDetails, isEnumerable: boolean): Promise<number> {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let countFunction = isEnumerable ? "Count" : "Length";
        const count = await session.evaluateExpression(`${varName}.${countFunction}`, "variables");
        return parseInt(count.result as string);
    }
}