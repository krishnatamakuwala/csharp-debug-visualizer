import { RequestStatusType } from "../../Enums/RequestStatusType";
import { DataTable } from "../../Enums/VariableType";
import { RequestStatus } from "../../Models/RequestProgressStatus";

export interface IResultProvider {
    getResult(): Promise<string | DataTable | RequestStatusType.cancelled>;
}