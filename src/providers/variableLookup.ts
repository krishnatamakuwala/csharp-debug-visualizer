import { ValueNotFoundError } from "../errors/errors";
import { DebugSessionDetails, IVariable } from "../debug/debugSession";
import { Logger } from "../utilities/Logger";

export class CommonResultProvider {

    private variableName: string;
    private variableList: IVariable[];
    private childName: string | null;
    private matchExactName: boolean;

    constructor(_variableName: string, _variableList: IVariable[], _childName: string | null = null, _matchExactName: boolean = true) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.childName = _childName;
        this.matchExactName = _matchExactName;
    }

    /**
     * Find variable by evaluate name
     * @returns Matched variable
     */
    private findVariable(): IVariable {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        const matches = this.matchExactName
            ? this.variableList.filter(x => x.evaluateName === varName)
            : this.variableList.filter(x => x.evaluateName?.includes(varName));

        if (!matches || !matches[0]) {
            Logger.error(`Variable lookup FAILED: "${varName}" not found in list of ${this.variableList.length} variables`,
                this.variableList.map(v => v.evaluateName)
            );
            throw new ValueNotFoundError();
        }
        Logger.info(`Variable lookup OK: "${varName}" → ref=${matches[0].variablesReference}, value="${matches[0].value?.substring(0, 80)}"`);
        return matches[0];
    }

    /**
     * Get Variable reference
     * @returns Variable reference
     */
    public getVariableReference(): number {
        return this.findVariable().variablesReference;
    }

    /**
     * Get value by evaluate name
     */
    public getValue(): string {
        return this.findVariable().value;
    }

    /**
     * Get count of child of array or enumerable variable
     * @param session Active session
     * @param isEnumerable Is Enumerable
     * @returns Count of child of array or enumerable variable
     */
    public async getCountOfChild(session: DebugSessionDetails, isEnumerable: boolean): Promise<number> {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        let countFunction = isEnumerable ? "Count" : "Length";
        const count = await session.evaluateExpression(`${varName}.${countFunction}`, "variables");
        const countStr = count.result !== undefined && count.result !== null ? String(count.result) : "0";
        return parseInt(countStr);
    }
}
