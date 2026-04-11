/**
 * Debug Adapter Protocol (DAP) interfaces
 * Used for communication with the C# debugger
 */

export interface IThread {
    id: number;
    name: string;
}

export interface IStackTraceInfo {
    totalFrames?: number;
    stackFrames: IStackFrame[];
}

export interface IStackFrame {
    id: number;
    name: string;
    source: { name: string; path: string };
}

export interface IScope {
    name: string;
    variablesReference: number;
}

export interface IVariable {
    name: string;
    value: string;
    evaluateName?: string;
    variablesReference: number;
}

export interface IEvaluatedResult {
    result: string;
    variablesReference: number;
}
