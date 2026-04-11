import { Variable } from "./Variable";
import { RequestStatusType } from "../constants/requestStatus";

export interface ProcessResult {
    variable: Variable;
    requestStatusType: RequestStatusType;
}
