import { IVariable } from "../../Proxies/DebugSessionDetails";
import { IResultProvider } from "./IResultProvider";

export class SingleTypeResultProvider implements IResultProvider {

    variableName: string;
    variableList: IVariable[];
    childName: string | null;

    constructor(_variableName: string, _variableList: IVariable[], _childName: string | null = null) {
        this.variableName = _variableName;
        this.variableList = _variableList;
        this.childName = _childName;
    }

    public async getResult(): Promise<string> {
        const varName = this.childName !== null ? this.variableName + "." + this.childName : this.variableName;
        return Promise.resolve(this.variableList.filter(x => x.evaluateName === varName)[0].value);
    }
}