import { Progress } from "vscode";
import { ErrorMessage } from "../Enums/Message";
import { ArrayVariableType, SingleVariableType } from "../Enums/VariableType";
import { Variable } from "../Models/Variable";
import { CustomDebugAdapter } from "../Proxies/CustomDebugAdapter";
import { DebugSessionDetails } from "../Proxies/DebugSessionDetails";
import { RequestStatusType } from "../Enums/RequestStatusType";
import { RequestStatus, ProgressTracker } from "../Models/RequestProgressStatus";

export class ResultHelper {

    /**
     * Get result based on selected variable
     * @param customDebugAdapter Object of custom debug adapter
     * @param session Object of debug sessio details 
     * @param {Progress} progress Progress class to track and manage progress
     */
    public static async getResult(customDebugAdapter: CustomDebugAdapter | undefined, session: DebugSessionDetails | undefined, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
        try {
            if (customDebugAdapter === undefined) {
                throw ErrorMessage.customDebugAdapaterNotFound;
            }
            if (session === undefined) {
                throw ErrorMessage.undefinedSession;
            }

            progress.report({ increment: (20 - ProgressTracker.progress) });
            ProgressTracker.progress = 20;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return;
            }

            //#region Get parent variable or first level variables
            let variablesList = await customDebugAdapter.getParentVariablesList();
            //#endregion

            progress.report({ increment: (30 - ProgressTracker.progress) });
            ProgressTracker.progress = 30;
            if (ResultHelper.checkIfRequestIsCancelled()) {
                return;
            }

            //#region Get value for selected variable
            if (SingleVariableType.typeArray.includes(Variable.type)) {
                Variable.result = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === Variable.varName)[0].value;
            } else if (ArrayVariableType.typeArray.includes(Variable.type)) {
                let varRef = await variablesList.filter((x: { evaluateName: string; }) => x.evaluateName === Variable.varName)[0].variablesReference;
                let childCount = await this.getCountOfChild(session);
                Variable.result = (await session.getVariables(varRef, 0, childCount)).map(x => { return x.value; }).toString();
            }
            //#endregion

            progress.report({ increment: (90 - ProgressTracker.progress) });
            ProgressTracker.progress = 90;
        } catch (error) {
            RequestStatus.status = RequestStatusType.Failed;
            throw error;
        }
    }

    /**
     * Check if request has been cancelled or not
     * @param {RequestStatusType} requestStatus Request status
     * @returns true - If request has been cancelled, false - If request has not been cancelled
     */
    public static checkIfRequestIsCancelled() {
        if (RequestStatus.status === RequestStatusType.Cancelled) {
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
    public static async getCountOfChild(session: DebugSessionDetails) {
        if (session.activeStackFrameId === undefined) {
            throw ErrorMessage.undefinedSession;
        }
        return parseInt((await session.evaluateExpression(`${Variable.varName}.Count()`, session.activeStackFrameId, "variables")).result);
    }

    public static async getArrayVariableResult(session: DebugSessionDetails, childCount: number) {
        // se
        // if (childCount <= 100) {
        //     Variable.result = (await session.getVariables(varRef, 0, 20)).map(x => { return x.value; }).toString();
        // }
    }
}