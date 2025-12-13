import { createMockVariable } from "../Mocks/MockVariable";

export function buildArrayVariables(count: number, countPerPage: number) {
    const variables = [];
    let index = 0;
    while (index < count) {
        let value = `${index + 1}`;

        if (index !== 0 && index % countPerPage === 0 && index !== count) {
            variables.push(
                createMockVariable(`x${index}`, "", 1003 + index, `testVar[${index}]`)
            );
        }

        variables.push(
            createMockVariable(`x${index}`, value, 1003 + index, `testVar[${index}]`)
        );
        index++;
    }
    return variables;
}

export function buildExpectedResult(count: number) {
    return Array.from({ length: count }, (_, i) => i + 1).join(", ");
}