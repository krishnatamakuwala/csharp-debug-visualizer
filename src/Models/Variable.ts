/**
 * Details of visualized result for selected variable
 */
class Variable {
    varName: string = "";
    type: string = "";
    result: string | DataTable = "";
}

/**
 * DataTable variable type
 */
class DataTable {
    tableName: string = "";
    dataTableConfig: DataTableConfig | null = null;
    columns: Columns | null = null;
    rows: Rows | null = null;
}

/**
 * DataTable configuration for DataTbale variable
 */
class DataTableConfig {
    totalPage: number = 0;
    currentPage: number = 0;
    recordsPerPage: number = 0;
}

/**
 * DataTable Columns
 */
class Columns {
    count: number = 0;
    list: string[] = [];
}

/**
 * DataTable Rows
 */
class Rows {
    count: number = 0;
    list: string[][] = [];
}

export {
    Variable,
    DataTable,
    DataTableConfig,
    Columns,
    Rows
}