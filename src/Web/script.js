//#region Initialzation
var genericContainer = document.getElementById("generic-container");
var genericName = document.getElementById("generic-name");
var genericResult = document.getElementById("generic-result");

var datatableContainer = document.getElementById("datatable-container");
var dataTableName = document.getElementById("datatable-name");
var tableName = document.getElementById("table-name");
var columnCount = document.getElementById("column-count");
var rowCount = document.getElementById("row-count");
var datatable = document.getElementById("datatable");
var datatableColumns = document.getElementById("datatable-columns");
var datatableRows = document.getElementById("datatable-rows");
var totalPage = document.getElementById("pagination-total-page");
var currentPage = document.getElementById("pagination-current-page");
var recordsPerPage = document.getElementById("records-per-page");

var btnWordWrap = document.getElementById("btn-word-wrap");
var btnCopy = document.getElementById("btn-copy");

var popupContainer = document.getElementById("popup-container");
var popupMessage = document.getElementById("popup-message");
var iconSuccess = document.getElementById("icon-success");
var iconError = document.getElementById("icon-error");
var iconClose = document.getElementById("icon-close");

const vscode = acquireVsCodeApi();
var popupTimeout;
//#endregion

getData();

var dataTableConfig = {
    recordsPerPage: 10,
    currentPage: 1,
    totalPage: 0
}

//#region Listners
window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
        case "setData":
            setData(message.data);
            break;
    }
});

btnWordWrap.addEventListener("click", function () {
    wrapText();
});

btnCopy.addEventListener("click", function () {
    copyToClipBoard();
});

iconClose.addEventListener("click", function () {
    clearTimeout(popupTimeout);
    closePopup();
});

currentPage.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        getDataWithConfig();
    }
});
//#endregion

function setData(variable) {
    if (variable.type === "System.Data.DataTable") {
        hideElement(genericContainer);
        dataTableName.innerHTML = variable.varName;
        tableName.innerHTML = variable.result.tableName;
        columnCount.innerHTML = variable.result.columns.count;
        rowCount.innerHTML = variable.result.rows.count;
        createTable(variable.result);
    } else {
        hideElement(datatableContainer);
        genericName.innerHTML = variable.varName;
        genericResult.innerHTML = variable.result;
    }
}

function createTable(dt) {
    createColumns(dt.columns);
    createRows(dt.rows);
}

function createColumns(columns) {
    let _columns = "<tr>";
    _columns += "<th></th>";
    columns.list.forEach((column) => {
        _columns += "<th>" + column + "</th>";
    });
    _columns += "</tr>";
    datatableColumns.innerHTML = _columns;
}

function createRows(rows) {
    let _rows = "";
    let i = 1;
    rows.list.forEach((row) => {
        _rows += "<tr>";
        _rows += '<td>' + i + "</td>";
        row.forEach((data) => {
            _rows += "<td>" + data + "</td>";
        });
        _rows += "</tr>";
        i++;
    });

    datatableRows.innerHTML = _rows;
    totalPage.innerHTML = dt.dataTableConfig.totalPage;
    currentPage.value = dt.dataTableConfig.currentPage;
    recordsPerPage.value = dt.dataTableConfig.recordsPerPage;
}

function changePageDataTable() {
    createRows(dt.Rows);
}

//#region Control - Functions
function copyToClipBoard() {
    var result = genericResult.innerHTML;
    var message = "Copied to clipboard.";
    var status = "success";

    if (navigator.clipboard) {
        navigator.clipboard.writeText(result);
    } else {
        message = "Error while copying to clipboard.";
        status = "error";
    }

    showNotification(message, status, true);
}

function wrapText() {
    if (genericResult.style.whiteSpace === "normal") {
        genericResult.style.whiteSpace = "nowrap"
    } else {
        genericResult.style.whiteSpace = "normal"
    }
}
//#endregion

function showNotification(message, type, isAutoClosable) {
    if (!popupContainer.classList.contains("show")) {
        if (type === "success") {
            popupContainer.classList.add("success");
            iconSuccess.style.display = "block";
        } else if (type === "error") {
            popupContainer.classList.add("error");
            iconError.style.display = "block";
        }
        popupMessage.innerHTML = message;
        popupContainer.classList.toggle("show");
        if (isAutoClosable) {
            popupTimeout = setTimeout(function () {
                closePopup();
            }, 3200);
        }
    }
}

function closePopup() {
    popupContainer.classList.toggle("show");
    setTimeout(function () {
        popupContainer.classList.remove("success");
        popupContainer.classList.remove("error");
        iconSuccess.style.display = "none";
        iconError.style.display = "none";
    }, 500);
}

function getDataWithConfig(_config) {
    vscode.postMessage({
        command: "getData",
        text: JSON.stringify(_config)
    });
}

function getData() {
    console.log("calling");
    vscode.postMessage({
        command: "getData"
    });
    console.log("called");
}

function hideElement(element) {
    element.style.display = "none";
}