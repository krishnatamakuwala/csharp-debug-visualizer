import { Progress } from "vscode";
import { DataTableConfig, Variable } from "../models/Variable";
import { CustomDebugAdapter } from "../debug/debugAdapter";
import { DebugSessionDetails } from "../debug/debugSession";
import { RequestStatusType } from "../constants/requestStatus";
import { ArrayVariableType, DataTableVariableType, CollectionVariableType, KeyValueVariableType, DataSetVariableType, TupleVariableType, OtherVariableType, SingleVariableType } from "../constants/variableTypes";
import { RequestContext } from "../models/RequestContext";
import { SingleTypeResultProvider } from "./singleTypeProvider";
import { ArrayTypeResultProvider } from "./arrayTypeProvider";
import { DataColumnTypeResultProvider } from "./dataColumnProvider";
import { DataRowTypeResultProvider } from "./dataRowProvider";
import { DataTableTypeResultProvider, OnHeaderReady } from "./dataTableProvider";
import { OnBatchReady } from "./dataTableRows";
import { GenericListTypeResultProvider } from "./genericListProvider";
import { DictionaryTypeResultProvider } from "./dictionaryProvider";
import { DataSetTypeResultProvider } from "./dataSetProvider";
import { ObjectTypeResultProvider } from "./objectProvider";

export class ResultHelper {

    /**
     * Get result based on selected variable
     * @param customDebugAdapter Object of custom debug adapter
     * @param session Object of debug session details
     * @param variable Variable
     * @param config DataTable configuration
     * @param {Progress} progress Progress class to track and manage progress
     * @param requestContext Per-request context for status and progress tracking
     */
    public static async getResult(customDebugAdapter: CustomDebugAdapter, session: DebugSessionDetails, variable: Variable, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>, config: DataTableConfig | null, onHeaderReady: OnHeaderReady | null = null, onBatchReady: OnBatchReady | null = null, requestContext: RequestContext = new RequestContext()): Promise<Variable | RequestStatusType.cancelled> {
        try {
            const checkCancelled = () => requestContext.isCancelled();

            let resultProvider: SingleTypeResultProvider | ArrayTypeResultProvider | DataColumnTypeResultProvider | DataRowTypeResultProvider | DataTableTypeResultProvider | GenericListTypeResultProvider | DictionaryTypeResultProvider | DataSetTypeResultProvider | ObjectTypeResultProvider;

            progress.report({ increment: (10 - requestContext.progress) });
            requestContext.progress = 10;
            if (checkCancelled()) {
                return RequestStatusType.cancelled;
            }

            //#region Get parent variable or first level variables
            let variablesList = await customDebugAdapter.getParentVariablesList();
            //#endregion

            progress.report({ increment: (20 - requestContext.progress) });
            requestContext.progress = 20;
            if (checkCancelled()) {
                return RequestStatusType.cancelled;
            }

            //#region Get value for selected variable
            if (variable.type === OtherVariableType.null) {
                variable.result = OtherVariableType.null;
            } else {
                if (SingleVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new SingleTypeResultProvider(variable.varName, variablesList, null, checkCancelled);
                }
                else if (ArrayVariableType.typeArray.includes(variable.type)) {
                    resultProvider = new ArrayTypeResultProvider(variable.varName, variablesList, session, null, false, progress, checkCancelled);
                }
                else if (variable.type === DataTableVariableType.dataColumn) {
                    resultProvider = new DataColumnTypeResultProvider(variable.varName, variablesList, session, checkCancelled);
                }
                else if (variable.type === DataTableVariableType.dataRow) {
                    resultProvider = new DataRowTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (variable.type === DataTableVariableType.dataTable) {
                    resultProvider = new DataTableTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled, config, onHeaderReady, onBatchReady);
                }
                else if (variable.type === DataSetVariableType.dataSet) {
                    resultProvider = new DataSetTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (KeyValueVariableType.typeSubstrings.some((t: string) => variable.type.includes(t))) {
                    resultProvider = new DictionaryTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (CollectionVariableType.typeSubstrings.some((t: string) => variable.type.includes(t))) {
                    resultProvider = new GenericListTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (variable.type.includes(TupleVariableType.tuple) || variable.type.includes(TupleVariableType.valueTuple)) {
                    resultProvider = new ObjectTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (variable.type === DataSetVariableType.dataView) {
                    resultProvider = new ObjectTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else if (variable.type.includes(CollectionVariableType.genericList)) {
                    resultProvider = new GenericListTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                }
                else {
                    // Fallback: try object property display for any complex type,
                    // or single value for primitives
                    const evalCheck = await session.evaluateExpression(`${variable.varName}.GetType().IsClass`, "variables");
                    if (evalCheck.result === "true") {
                        resultProvider = new ObjectTypeResultProvider(variable.varName, variablesList, session, progress, checkCancelled);
                    } else {
                        resultProvider = new SingleTypeResultProvider(variable.varName, variablesList, null, checkCancelled);
                    }
                }
                const result = await resultProvider.getResult();
                if (result.status === "cancelled") {
                    return RequestStatusType.cancelled;
                }
                variable.result = result.data;
            }
            //#endregion

            progress.report({ increment: (90 - requestContext.progress) });
            requestContext.progress = 90;
            return variable;
        } catch (error) {
            requestContext.status = RequestStatusType.failed;
            throw error;
        }
    }
}
