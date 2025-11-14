import { RequestStatusType } from "../../Enums/RequestStatusType";
import { DataTableVariableType } from "../../Enums/VariableType";

export interface IResultProvider {
    getResult(): Promise<string | DataTableVariableType | RequestStatusType.cancelled>;
}