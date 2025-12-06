import { SinonStub } from "sinon";
import { createMockVariable } from "./MockVariable";
import { DataTable } from "../../Models/Variable";

/**
 * Create mock datatable result
 * @param mockSession Mock session
 * @param totalCount Total count of records
 * @param recordsPerPage Records per page
 * @param currentPage Current Page
 * @returns Expected result
 */
export function createMockDataTableResult(mockSession: SinonStub, totalCount: number, recordsPerPage: number, currentPage: number): DataTable {

    let count: number = Math.min(recordsPerPage, totalCount - ((currentPage - 1) * recordsPerPage));
    const totalPage = Math.ceil(totalCount / recordsPerPage);
    const offset = recordsPerPage * (currentPage - 1);
    if (currentPage <= 0 || currentPage > totalPage) {
        throw new Error("Invalid page config in test");
    }

    mockSession
        .onCall(0).resolves({
            variables: [
                createMockVariable("Columns", "{System.Data.DataColumnCollection}", 1003, "testVar.Columns"),
                createMockVariable("TableName [string]", "\"\"", 1004, "testVar.TableName"),
                createMockVariable("Rows", "{System.Data.DataRowsCollection}", 1005, "testVar.Rows")
            ]
        })
        .onCall(1).resolves({
            variables: [
                createMockVariable("Count [int]", "3", 1006, "testVar.Columns.Count"),
                createMockVariable("List [ArrayList]", "Count = 3", 1007, "testVar.Columns.List")
            ]
        })
        .onCall(2).resolves({
            variables: [
                createMockVariable("x", "10", 1011, "testVar[0]"),
                createMockVariable("y", "20", 1012, "testVar[1]"),
                createMockVariable("z", "30", 1013, "testVar[2]"),
                createMockVariable("blank", "\"\"", 1014, "testVar[blank]")
            ]
        })
        .onCall(3).resolves({
            variables: [
                createMockVariable("Count [int]", totalCount.toString(), 1015, "testVar.Rows.Count"),
                createMockVariable("List [ArrayList]", "null", 1016, "testVar.Rows.List")
            ]
        });

    for (let index = 1; index < count * 2; index = index + 2) {
        const i = ((index - 1) / 2) + offset;
        mockSession
            .onCall(index + 3).resolves({
                result: "3",
                variablesReference: 1016 + index,
            })
            .onCall(index + 3 + 1).resolves({
                variables: [
                    createMockVariable("x", `${i}0`, 1003, `testVar.Rows[${i}].ItemArray[0]`),
                    createMockVariable("y", `${i}1`, 1004, `testVar.Rows[${i}].ItemArray[1]`),
                    createMockVariable("z", `${i}2`, 1005, `testVar.Rows[${i}].ItemArray[2]`)
                ]
            });
    }

    const expectedResult: DataTable = {
        columns: {
            count: 3,
            list: ['10', '20', '30']
        },
        dataTableConfig: {
            currentPage: currentPage,
            recordsPerPage: recordsPerPage,
            totalPage: Math.ceil(totalCount / recordsPerPage)
        },
        rows: {
            count: totalCount,
            list: []
        },
        tableName: '""'
    }

    for (let index = 0; index < count; index++) {
        const i = index + offset;
        expectedResult.rows?.list.push(
            [`${i}0`, `${i}1`, `${i}2`]
        );
    }
    return expectedResult;
}