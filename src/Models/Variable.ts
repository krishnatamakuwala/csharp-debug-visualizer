/**
 * Details of visualized result for selected variable
 */
export class Variable {
    varName: string = "";
    type: string = "";
    result: string | DataTable = "";
}

export class DataTable {
    tableName: string = "";
    dataTableConfig: DataTableConfig | null = null;
    columns: Columns | null = null;
    rows: Rows | null = null;
}

export class DataTableConfig {
    totalPage: number = 0;
    currentPage: number = 0;
    recordsPerPage: number = 0;
}

export class Columns {
    count: number = 0;
    list: string[] = [];
}

export class Rows {
    count: number = 0;
    list: string[][] = [];
}