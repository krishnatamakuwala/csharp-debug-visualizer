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
            }
            else if (ArrayVariableType.typeArray.includes(variable.type)) {
                let varRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].variablesReference;
                await this.getArrayVariableResult(varRef, session, variable, null, progress);
            }
            else if (variable.type === DataTable.dataColumn) {
                var verRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].variablesReference;
                var varResponse = await session.getVariables(verRef, 0);
                // variable.result = varResponse.filter(x => x.evaluateName === `${variable.varName}.ColumnName`)[0].value;
                await this.getArrayVariableResult(verRef, session, variable, 'ColumnName', progress);
            }
            else if (variable.type === DataTable.dataRow) {
                let varRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === variable.varName)[0].variablesReference;
                let dataRow = await session.getVariables(varRef, 0);
                varRef = dataRow.filter(x => x.evaluateName === `${variable.varName}.ItemArray`)[0].variablesReference;
                await this.getArrayVariableResult(varRef, session, variable, 'ItemArray', progress);
                // var rowsItemVariableRef = dataRow.filter((x: { evaluateName: string; }) => x.evaluateName === `${variable.varName}.RowName`)[0].variablesReference;
                // await this.getArrayVariableResult(rowsItemVariableRef, session, variable, progress);
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
        return parseInt((await session.evaluateExpression(`${variableName}.Count()`, session.activeStackFrameId, "variables")).result);
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
            if (currentPage + 1 !== totalPage)
            {
                varResult.pop();
            }
            variable.result = variable.result + (currentPage === 0 ? "" : ", ") + varResult.join(", ");

            progress.report({ increment: 50 / totalPage });
            ProgressTracker.progress = ProgressTracker.progress + (50 / totalPage);

            currentPage++;
        }
    }
}