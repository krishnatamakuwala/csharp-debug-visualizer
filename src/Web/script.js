//#region Initialzation

//#region Generic
var genericContainer = document.getElementById("generic-container");
var genericName = document.getElementById("generic-name");
var genericResult = document.getElementById("generic-result");
//#endregion

//#region DataTable
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
var firstPageBtn = document.getElementById("first-page-btn");
var previousPageBtn = document.getElementById("previous-page-btn");
var nextPageBtn = document.getElementById("next-page-btn");
var lastPageBtn = document.getElementById("last-page-btn");
var oldCurrentPage = currentPage.value;
//#endregion

//#region Functions
var btnWordWrap = document.getElementById("btn-word-wrap");
var btnCopy = document.getElementById("btn-copy");
var btnRefresh = document.getElementById("btn-refresh");
//#endregion

//#region Popup Notification
var popupContainer = document.getElementById("popup-container");
var popupMessage = document.getElementById("popup-message");
var iconSuccess = document.getElementById("icon-success");
var iconError = document.getElementById("icon-error");
var iconClose = document.getElementById("icon-close");
//#endregion

const vscode = acquireVsCodeApi();
var popupTimeout;
var isProcessing = false;
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

btnRefresh.addEventListener("click", function () {
    refreshData();
});

iconClose.addEventListener("click", function () {
    clearTimeout(popupTimeout);
    closePopup();
});

currentPage.addEventListener("keyup", function (event) {
    if (isProcessing) {
        currentPage.value = oldCurrentPage;
        return;
    }
    if (event.key === "Enter") {
        if (Number(currentPage.value) % 1 !== 0) {
            showNotification("Current page can not be a decimal value.", "error", true);
            currentPage.value = oldCurrentPage;
            return;
        } else if (Number(currentPage.value) < 1) {
            showNotification("Current page can not be less than 1.", "error", true);
            currentPage.value = oldCurrentPage;
            return;
        } else if (Number(currentPage.value) > Number(totalPage.innerHTML)) {
            showNotification("Current page can not be more than total pages.", "error", true);
            currentPage.value = oldCurrentPage;
            return;
        } else {
            getDataTableWithConfig();
        }
    }
});

recordsPerPage.addEventListener("change", function () {
    if (isProcessing) {
        return;
    }
    getDataTableWithConfig();
});

firstPageBtn.addEventListener("click", function () {
    if (isProcessing) {
        return;
    }
    if (Number(currentPage.value) > 1) {
        currentPage.value = 1;
        oldCurrentPage = currentPage.value;
        getDataTableWithConfig();
        togglePreviousOrNextPageBtn();
    }
});

previousPageBtn.addEventListener("click", function () {
    if (isProcessing) {
        return;
    }
    if (Number(currentPage.value) > 1) {
        currentPage.value = Number(currentPage.value) - 1;
        oldCurrentPage = currentPage.value;
        getDataTableWithConfig();
        togglePreviousOrNextPageBtn();
    }
});

nextPageBtn.addEventListener("click", function () {
    if (isProcessing) {
        return;
    }
    if (Number(currentPage.value) < Number(totalPage.innerHTML)) {
        currentPage.value = Number(currentPage.value) + 1;
        oldCurrentPage = currentPage.value;
        getDataTableWithConfig();
        togglePreviousOrNextPageBtn();
    }
});

lastPageBtn.addEventListener("click", function () {
    if (isProcessing) {
        return;
    }
    if (Number(currentPage.value) < Number(totalPage.innerHTML)) {
        currentPage.value = Number(totalPage.innerHTML);
        oldCurrentPage = currentPage.value;
        getDataTableWithConfig();
        togglePreviousOrNextPageBtn();
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
        recordsPerPage.value = variable.result.dataTableConfig.recordsPerPage;
        currentPage.value = variable.result.dataTableConfig.currentPage;
        oldCurrentPage = currentPage.value;
        totalPage.innerHTML = variable.result.dataTableConfig.totalPage;
        createTable(variable.result);
        togglePreviousOrNextPageBtn();
    } else {
        hideElement(datatableContainer);
        genericName.innerHTML = variable.varName;
        genericResult.innerHTML = variable.result;
    }
    isProcessing = false;
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
        _rows += '<td>' + (((currentPage.value - 1) * recordsPerPage.value) + i) + "</td>";
        row.forEach((data) => {
            _rows += "<td>" + data + "</td>";
        });
        _rows += "</tr>";
        i++;
    });

    datatableRows.innerHTML = _rows;
}

function getDataTableWithConfig() {
    const config = {
        currentPage: Number(currentPage.value),
        recordsPerPage: Number(recordsPerPage.value),
        totalPage: Number(totalPage.innerHTML)
    }
    getDataWithConfig(config);
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

function refreshData() {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    vscode.postMessage({
        command: "refreshData"
    });
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
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    vscode.postMessage({
        command: "getData",
        text: JSON.stringify(_config)
    });
}

function getData() {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    vscode.postMessage({
        command: "getData"
    });
}

function hideElement(element) {
    element.style.display = "none";
}

function togglePaginationBtn(btn, isDisabled) {
    btn.disabled = isDisabled;
}

function togglePreviousOrNextPageBtn() {
    if (Number(currentPage.value) <= 1) {
        togglePaginationBtn(previousPageBtn, true);
        togglePaginationBtn(firstPageBtn, true);
    } else {
        togglePaginationBtn(previousPageBtn, false);
        togglePaginationBtn(firstPageBtn, false);
    }
    if (Number(currentPage.value) >= Number(totalPage.innerHTML)) {
        togglePaginationBtn(nextPageBtn, true);
        togglePaginationBtn(lastPageBtn, true);
    } else {
        togglePaginationBtn(nextPageBtn, false);
        togglePaginationBtn(lastPageBtn, false);
    }
}