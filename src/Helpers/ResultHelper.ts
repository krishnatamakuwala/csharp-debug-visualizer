import { Progress } from "vscode";
import { ErrorMessage } from "../Enums/Message";
import { Variable } from "../Models/Variable";
import { CustomDebugAdapter } from "../Proxies/CustomDebugAdapter";
import { DebugSessionDetails } from "../Proxies/DebugSessionDetails";
import { RequestStatusType } from "../Enums/RequestStatusType";
import { ArrayVariableType, DataTable, SingleVariableType } from "../Enums/VariableType";
import { RequestStatus, ProgressTracker } from "../Models/RequestProgressStatus";

export class ResultHelper {

    /**
     * Get result based on selected variable
     * @param customDebugAdapter Object of custom debug adapter
     * @param session Object of debug session details 
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getResult(customDebugAdapter: CustomDebugAdapter | undefined, session: DebugSessionDetails | undefined, variable: Variable, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        try {
            if (customDebugAdapter === undefined) {
                throw ErrorMessage.customDebugAdapaterNotFound;
            }
            if (session === undefined) {
                throw ErrorMessage.undefinedSession;
            }

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
            if (SingleVariableType.typeArray.includes(variable.type)) {
                variable.result = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].value;
            } else if (ArrayVariableType.typeArray.includes(variable.type)) {
                let varRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].variablesReference;
                await this.getArrayVariableResult(varRef, session, variable, progress);
            } else if (variable.type === DataTable.dataColumn) {
                var verRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].variablesReference;
                var varResponse = await session.getVariables(verRef, 0);
                variable.result = varResponse.filter(x => x.evaluateName === `${variable.varName}.ColumnName`)[0].value;
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
    public static checkIfRequestIsCancelled() {
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
    public static async getCountOfChild(session: DebugSessionDetails, variable: Variable) {
        if (session.activeStackFrameId === undefined) {
            throw ErrorMessage.undefinedSession;
        }
        return parseInt((await session.evaluateExpression(`${variable.varName}.Count()`, session.activeStackFrameId, "variables")).result);
    }

    /**
     * Get elements of an array type variable
     * @param variablesReference Variable reference for child elements
     * @param session Active session
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getArrayVariableResult(variablesReference: number, session: DebugSessionDetails, variable: Variable, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        let childCount = await this.getCountOfChild(session, variable);
        let currentPage = 0;
        let totalPage = Math.ceil(childCount / 20);
        while (currentPage + 1 <= totalPage) {
            var varResult = (await session.getVariables(variablesReference, (currentPage * 20), 20)).map(x => { return x.value; });
            if (currentPage + 1 !== totalPage)
            {
                varResult.pop();
            }
            variable.result = variable.result + (currentPage === 0 ? "" : ",") + varResult.toString();

            progress.report({ increment: 50 / totalPage });
            ProgressTracker.progress = ProgressTracker.progress + (50 / totalPage);

            currentPage++;
        }
    }
}