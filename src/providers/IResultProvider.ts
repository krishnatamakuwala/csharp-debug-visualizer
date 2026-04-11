import { ProviderResult } from "../types/result";
import { DataTable } from "../models/Variable";

export interface IResultProvider {
    getResult(): Promise<ProviderResult<string | DataTable>>;
}
