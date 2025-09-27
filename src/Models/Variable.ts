/**
 * Details of visualized result for selected variable
 */
export class Variable {
    varName: string = "";
    type: string = "";
    result: string | DataTable = "";
}

class DataTable {
    columns: Columns | null = null;
    row: Rows | null = null;
}

class Columns {
    count: number = 0;
    list: [] = [];
}

class Rows {
    count: number = 0;
    list: [] = [];
}