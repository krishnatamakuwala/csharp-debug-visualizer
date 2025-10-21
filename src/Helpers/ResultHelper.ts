import { DebugSession, Progress } from "vscode";
import { ErrorMessage } from "../Enums/Message";
import { Variable } from "../Models/Variable";
import { CustomDebugAdapter } from "../Proxies/CustomDebugAdapter";
import { DebugSessionDetails } from "../Proxies/DebugSessionDetails";
import { RequestStatusType } from "../Enums/RequestStatusType";
import { ArrayVariableType, DataTable, Default, SingleVariableType } from "../Enums/VariableType";
import { RequestStatus, ProgressTracker } from "../Models/RequestProgressStatus";
import { SingleTypeResultProvider } from "../Provider/Result/SingleTypeResultProvider";
import { ArrayTypeResultProvider } from "../Provider/Result/ArrayTypeResultProvider";
import { DataColumnTypeResultProvider } from "../Provider/Result/DataColumnTypeResultProvider";
import { DataRowTypeResultProvider } from "../Provider/Result/DataRowTypeResultProvider";
import { DataTableTypeResultProvider } from "../Provider/Result/DataTableTypeResultProvider";

export class ResultHelper {

    /**
     * Get result based on selected variable
     * @param customDebugAdapter Object of custom debug adapter
     * @param session Object of debug session details 
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getResult(customDebugAdapter: CustomDebugAdapter, session: DebugSessionDetails | undefined, variable: Variable, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        try {
            if (session === undefined) {
                throw ErrorMessage.undefinedSession;
            }

            let resultProvider: SingleTypeResultProvider | ArrayTypeResultProvider | DataColumnTypeResultProvider | DataRowTypeResultProvider | DataTableTypeResultProvider;

            progress.report({ increment: (10 - ProgressTracker.progress) });
            ProgressTracker.progress = 10;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return;
            }

            //#region Get parent variable or first level variables
            let variablesList = await customDebugAdapter.getParentVariablesList();
            //#endregion

            progress.report({ increment: (20 - ProgressTracker.progress) });
            ProgressTracker.progress = 20;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return;
            }

            //#region Get value for selected variable
            if (variable.type === Default.null) {
                variable.result = Default.null;
            } else {
                if (SingleVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new SingleTypeResultProvider(variable.varName, variablesList, null, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (ArrayVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new ArrayTypeResultProvider(variable.varName, variablesList, session, null, false, progress, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTable.dataColumn) {
                    resultProvider = new DataColumnTypeResultProvider(variable.varName, variablesList, session, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTable.dataRow) {
                    resultProvider = new DataRowTypeResultProvider(variable.varName, variablesList, session, progress, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTable.dataTable) {
                    resultProvider = new DataTableTypeResultProvider(variable.varName, variablesList, session, progress, ResultHelper.checkIfRequestIsCancelled);
                }
                else {
                    resultProvider = new SingleTypeResultProvider(variable.varName, variablesList, null, ResultHelper.checkIfRequestIsCancelled);
                }
                const result = await resultProvider.getResult();
                if (result === RequestStatusType.cancelled) {
                    return RequestStatusType.cancelled;
                }
                variable.result = result;
            }
            //#endregion

            progress.report({ increment: (90 - ProgressTracker.progress) });
            ProgressTracker.progress = 90;
        } catch (error) {
            RequestStatus.status = RequestStatusType.failed;
            throw error;
        }
    }

    /**
     * Check if request has been cancelled or not
     * @param {RequestStatusType} requestStatus Request status
     * @returns true - If request has been cancelled, false - If request has not been cancelled
     */
    public static checkIfRequestIsCancelled(): boolean {
        if (RequestStatus.status === RequestStatusType.cancelled) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get count of child of array or enumerable variable
     * @param session Active session
     * @returns Count of child of array or enumerable variable
     */
    public static async getCountOfChild(session: DebugSessionDetails, variableName: string): Promise<number> {
        if (session.activeStackFrameId === undefined) {
            throw ErrorMessage.undefinedSession;
        }
        return parseInt((await session.evaluateExpression(`${variableName}.Count()`, session.activeStackFrameId, "variables")).result as string);
    }

    /**
     * Get elements of an array type variable
     * @param variablesReference Variable reference for child elements
     * @param session Active session
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getArrayVariableResult(variablesReference: number, session: DebugSessionDetails, variable: Variable, customArrayName: string | null, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        let variableName = customArrayName !== null ? `${variable.varName}.${customArrayName}` : variable.varName;
        let countPerPage = customArrayName !== null ? 10 : 20;
        let childCount = await this.getCountOfChild(session, variableName);
        let currentPage = 0;
        let totalPage = Math.ceil(childCount / countPerPage);
        while (currentPage + 1 <= totalPage) {
            var varResult = (await session.getVariables(variablesReference, (currentPage * countPerPage), countPerPage)).map(x => { return x.value; });
            if (currentPage + 1 !== totalPage) {
                varResult.pop();
            }
            variable.result = variable.result + (currentPage === 0 ? "" : ", ") + varResult.join(", ");

            progress.report({ increment: 50 / totalPage });
            ProgressTracker.progress = ProgressTracker.progress + (50 / totalPage);

            currentPage++;
        }
    }
}