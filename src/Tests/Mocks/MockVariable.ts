import { IVariable } from "../../debug/debugSession";

export function createMockVariable(
    name: string,
    value: string | number,
    variablesReference = 0,
    evaluateName: string = name
): IVariable {
    return {
        name,
        value: value.toString(),
        evaluateName: evaluateName,
        variablesReference
    };
}