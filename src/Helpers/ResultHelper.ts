import { Progress } from "vscode";
import { DataTableConfig, Variable } from "../Models/Variable";
import { CustomDebugAdapter } from "../Proxies/CustomDebugAdapter";
import { DebugSessionDetails } from "../Proxies/DebugSessionDetails";
import { RequestStatusType } from "../Enums/RequestStatusType";
import { ArrayVariableType, DataTableVariableType, OtherVariableType, SingleVariableType } from "../Enums/VariableType";
import { RequestStatus, ProgressTracker } from "../Models/RequestProgressStatus";
import { SingleTypeResultProvider } from "../Provider/Result/SingleTypeResultProvider";
import { ArrayTypeResultProvider } from "../Provider/Result/ArrayTypeResultProvider";
import { DataColumnTypeResultProvider } from "../Provider/Result/DataColumnTypeResultProvider";
import { DataRowTypeResultProvider } from "../Provider/Result/DataRowTypeResultProvider";
import { DataTableTypeResultProvider } from "../Provider/Result/DataTableTypeResultProvider";
import { GenericListTypeResultProvider } from "../Provider/Result/GenericListTypeResultProvider";

export class ResultHelper {

    /**
     * Get result based on selected variable
     * @param customDebugAdapter Object of custom debug adapter
     * @param session Object of debug session details
     * @param variable Variable
     * @param config DataTable configuration
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getResult(customDebugAdapter: CustomDebugAdapter, session: DebugSessionDetails, variable: Variable, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, config: DataTableConfig | null): Promise<Variable | RequestStatusType.cancelled> {
        try {

            let resultProvider: SingleTypeResultProvider | ArrayTypeResultProvider | DataColumnTypeResultProvider | DataRowTypeResultProvider | DataTableTypeResultProvider | GenericListTypeResultProvider;

            progress.report({ increment: (10 - ProgressTracker.progress) });
            ProgressTracker.progress = 10;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return RequestStatusType.cancelled;
            }

            //#region Get parent variable or first level variables
            let variablesList = await customDebugAdapter.getParentVariablesList();
            //#endregion

            progress.report({ increment: (20 - ProgressTracker.progress) });
            ProgressTracker.progress = 20;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return RequestStatusType.cancelled;
            }

            //#region Get value for selected variable
            if (variable.type === OtherVariableType.null) {
                variable.result = OtherVariableType.null;
            } else {
                if (SingleVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new SingleTypeResultProvider(variable.varName, variablesList, null, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (ArrayVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new ArrayTypeResultProvider(variable.varName, variablesList, session, null, false, progress, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTableVariableType.dataColumn) {
                    resultProvider = new DataColumnTypeResultProvider(variable.varName, variablesList, session, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTableVariableType.dataRow) {
                    resultProvider = new DataRowTypeResultProvider(variable.varName, variablesList, session, progress, ResultHelper.checkIfRequestIsCancelled);
                }
                else if (variable.type === DataTableVariableType.dataTable) {
                    resultProvider = new DataTableTypeResultProvider(variable.varName, variablesList, session, progress, ResultHelper.checkIfRequestIsCancelled, config);
                }
                else if (variable.type.includes(OtherVariableType.genericList)) {
                    resultProvider = new GenericListTypeResultProvider(variable.varName, variablesList, session, progress, ResultHelper.checkIfRequestIsCancelled);
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
            return variable;
        } catch (error) {
            RequestStatus.status = RequestStatusType.failed;
            throw error;
        }
    }

    /**
     * Check if request has been cancelled or not
     * @returns true - If request has been cancelled, false - If request has not been cancelled
     */
    public static checkIfRequestIsCancelled(): boolean {
        if (RequestStatus.status === RequestStatusType.cancelled) {
            return true;
        } else {
            return false;
        }
    }
}