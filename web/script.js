const POPUP_AUTO_CLOSE_MS = 3200;
const POPUP_TRANSITION_MS = 500;

//#region DOM References
const dom = {
    generic: {
        container: document.getElementById("generic-container"),
        name: document.getElementById("generic-name"),
        result: document.getElementById("generic-result"),
    },
    datatable: {
        container: document.getElementById("datatable-container"),
        name: document.getElementById("datatable-name"),
        tableName: document.getElementById("table-name"),
        columnCount: document.getElementById("column-count"),
        rowCount: document.getElementById("row-count"),
        table: document.getElementById("datatable"),
        columns: document.getElementById("datatable-columns"),
        rows: document.getElementById("datatable-rows"),
    },
    pagination: {
        totalPage: document.getElementById("pagination-total-page"),
        currentPage: document.getElementById("pagination-current-page"),
        recordsPerPage: document.getElementById("records-per-page"),
        firstBtn: document.getElementById("first-page-btn"),
        prevBtn: document.getElementById("previous-page-btn"),
        nextBtn: document.getElementById("next-page-btn"),
        lastBtn: document.getElementById("last-page-btn"),
    },
    buttons: {
        wordWrap: document.getElementById("btn-word-wrap"),
        copy: document.getElementById("btn-copy"),
        refresh: document.getElementById("btn-refresh"),
        export: document.getElementById("btn-export"),
    },
    popup: {
        container: document.getElementById("popup-container"),
        message: document.getElementById("popup-message"),
        iconSuccess: document.getElementById("icon-success"),
        iconError: document.getElementById("icon-error"),
        iconClose: document.getElementById("icon-close"),
    }
};
//#endregion

//#region State
const state = {
    variable: null,
    isProcessing: false,
    oldCurrentPage: dom.pagination.currentPage.value,
    popupTimeout: null,
    streamingRowIndex: 0,
};
//#endregion

const vscode = acquireVsCodeApi();

// Restore persisted state if available
const previousState = vscode.getState();
if (previousState && previousState.variable) {
    state.variable = previousState.variable;
}

//#region Utilities
function escapeHtml(str) {
    if (str === null || str === undefined) { return ""; }
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function hideElement(element) {
    element.style.display = "none";
}

function showElement(element, show = "block") {
    element.style.display = show;
}

function togglePaginationBtn(btn, isDisabled) {
    btn.disabled = isDisabled;
}

function togglePreviousOrNextPageBtn() {
    const cur = Number(dom.pagination.currentPage.value);
    const total = Number(dom.pagination.totalPage.textContent);
    togglePaginationBtn(dom.pagination.prevBtn, cur <= 1);
    togglePaginationBtn(dom.pagination.firstBtn, cur <= 1);
    togglePaginationBtn(dom.pagination.nextBtn, cur >= total);
    togglePaginationBtn(dom.pagination.lastBtn, cur >= total);
}
//#endregion

//#region Table Rendering Helpers
function prepareTableView(varName) {
    hideElement(dom.generic.container);
    hideElement(dom.buttons.copy);
    hideElement(dom.buttons.wordWrap);
    hideElement(dom.buttons.export);
    dom.datatable.name.textContent = varName;
}

function buildColumnHeaderHtml(columns) {
    let html = "<tr><th></th>";
    columns.forEach((col) => { html += "<th>" + escapeHtml(col) + "</th>"; });
    html += "</tr>";
    return html;
}

function buildTableHtml(columns, rows, emptyMessage) {
    dom.datatable.columns.innerHTML = buildColumnHeaderHtml(columns);

    if (!rows || rows.length === 0) {
        dom.datatable.rows.innerHTML = '<tr><td colspan="' + (columns.length + 1) + '" style="color: #888; padding: 12px; text-align: center;">' + escapeHtml(emptyMessage) + '</td></tr>';
        return;
    }
    let rowHtml = "";
    rows.forEach((row, i) => {
        rowHtml += "<tr><td>" + (i + 1) + "</td>";
        row.forEach((cell) => { rowHtml += "<td>" + escapeHtml(cell) + "</td>"; });
        rowHtml += "</tr>";
    });
    dom.datatable.rows.innerHTML = rowHtml;
}
//#endregion

//#region Renderers (data-driven)
const renderers = {
    dictionary(varName, data) {
        prepareTableView(varName);
        dom.datatable.tableName.textContent = "Dictionary";
        dom.datatable.columnCount.textContent = "2 (Key, Value)";
        dom.datatable.rowCount.textContent = data.count;
        const rows = data.entries.map((e) => [e.key, e.value]);
        buildTableHtml(["Key", "Value"], rows, "Empty dictionary");
    },

    dataset(varName, data) {
        prepareTableView(varName);
        dom.datatable.tableName.textContent = data.dataSetName || "DataSet";
        dom.datatable.columnCount.textContent = data.tableCount + " table(s)";
        dom.datatable.rowCount.textContent = "";
        const rows = data.tables.map((t) => [t.name, String(t.columns), String(t.rows)]);
        buildTableHtml(["Table Name", "Columns", "Rows"], rows, "Empty DataSet");
    },

    object(varName, data) {
        prepareTableView(varName);
        dom.datatable.tableName.textContent = "Object Properties";
        dom.datatable.columnCount.textContent = data.propertyCount + " properties";
        dom.datatable.rowCount.textContent = "";
        const rows = data.properties.map((p) => [p.name, p.value]);
        buildTableHtml(["Property", "Value"], rows, "No properties");
    }
};
//#endregion

//#region Core Data Handlers
function setData(_variable) {
    try {
        if (_variable.type === "System.Data.DataTable") {
            renderDataTable(_variable);
        } else if (typeof _variable.result === "string" && _variable.result.startsWith("{\"type\":")) {
            try {
                const parsed = JSON.parse(_variable.result);
                const renderer = renderers[parsed.type];
                if (renderer) {
                    renderer(_variable.varName, parsed);
                } else {
                    renderGeneric(_variable);
                }
            } catch {
                renderGeneric(_variable);
            }
        } else {
            renderGeneric(_variable);
        }
        state.variable = _variable;
        vscode.setState({ variable: _variable });
    } catch (err) {
        showError("Error rendering data: " + (err.message || err));
        console.error("[C# Debug Visualizer] setData error:", err);
    }
    state.isProcessing = false;
}

function renderDataTable(_variable) {
    prepareTableView(_variable.varName);
    showElement(dom.buttons.export);

    if (!_variable.result || typeof _variable.result !== "object") {
        showError("No data received for DataTable. Result: " + JSON.stringify(_variable.result));
        return;
    }
    if (!_variable.result.columns || !_variable.result.rows) {
        showError("DataTable result is incomplete. columns=" + JSON.stringify(_variable.result.columns) + ", rows=" + JSON.stringify(_variable.result.rows));
        return;
    }

    dom.datatable.tableName.textContent = _variable.result.tableName;
    dom.datatable.columnCount.textContent = _variable.result.columns.count;
    dom.datatable.rowCount.textContent = _variable.result.rows.count;
    dom.pagination.recordsPerPage.value = _variable.result.dataTableConfig.recordsPerPage;
    dom.pagination.currentPage.value = _variable.result.dataTableConfig.currentPage;
    state.oldCurrentPage = dom.pagination.currentPage.value;
    dom.pagination.totalPage.textContent = _variable.result.dataTableConfig.totalPage;
    createDataTableColumns(_variable.result.columns);
    createDataTableRows(_variable.result.rows);
    togglePreviousOrNextPageBtn();
}

function renderGeneric(_variable) {
    hideElement(dom.datatable.container);
    hideElement(dom.buttons.export);
    dom.generic.name.textContent = _variable.varName;
    dom.generic.result.textContent = _variable.result;
}

function createDataTableColumns(columns) {
    dom.datatable.columns.innerHTML = buildColumnHeaderHtml(columns.list);
}

function createDataTableRows(rows) {
    let html = "";
    let i = 1;
    rows.list.forEach((row) => {
        html += "<tr>";
        html += '<td>' + (((dom.pagination.currentPage.value - 1) * dom.pagination.recordsPerPage.value) + i) + "</td>";
        row.forEach((data) => { html += "<td>" + escapeHtml(data) + "</td>"; });
        html += "</tr>";
        i++;
    });
    dom.datatable.rows.innerHTML = html;
}
//#endregion

//#region Streaming / Progressive Rendering
function setDataTableHeader(data) {
    prepareTableView(data.varName);
    showElement(dom.buttons.export);
    dom.datatable.tableName.textContent = data.tableName;
    dom.datatable.columnCount.textContent = data.columnCount;
    dom.datatable.rowCount.textContent = data.rowCount;
    if (data.dataTableConfig) {
        dom.pagination.recordsPerPage.value = data.dataTableConfig.recordsPerPage;
        dom.pagination.currentPage.value = data.dataTableConfig.currentPage;
        state.oldCurrentPage = dom.pagination.currentPage.value;
        dom.pagination.totalPage.textContent = data.dataTableConfig.totalPage;
    }
    if (data.columns && data.columns.length > 0) {
        dom.datatable.columns.innerHTML = buildColumnHeaderHtml(data.columns);
    }
    dom.datatable.rows.innerHTML = '<tr><td colspan="100" style="color: #888; padding: 12px; text-align: center;">Loading rows...</td></tr>';
    state.streamingRowIndex = 0;
}

function appendRows(data) {
    if (state.streamingRowIndex === 0) {
        dom.datatable.rows.innerHTML = "";
    }
    let html = "";
    const startIndex = data.startIndex || state.streamingRowIndex;
    let i = startIndex + 1;
    data.rows.forEach((row) => {
        html += "<tr><td>" + i + "</td>";
        row.forEach((cell) => { html += "<td>" + escapeHtml(cell) + "</td>"; });
        html += "</tr>";
        i++;
    });
    dom.datatable.rows.innerHTML += html;
    state.streamingRowIndex += data.rows.length;
}

function onFetchComplete() {
    togglePreviousOrNextPageBtn();
    state.isProcessing = false;
}
//#endregion

//#region Error Display
function showError(message) {
    hideElement(dom.generic.container);
    hideElement(dom.buttons.copy);
    hideElement(dom.buttons.wordWrap);
    dom.datatable.tableName.textContent = "";
    dom.datatable.columnCount.textContent = "";
    dom.datatable.rowCount.textContent = "";
    dom.datatable.columns.innerHTML = "";
    dom.datatable.rows.innerHTML = '<tr><td colspan="100" style="color: #f44336; padding: 12px; text-align: center;">' + escapeHtml(message) + '</td></tr>';
}
//#endregion

//#region Actions
function copyToClipBoard() {
    const result = dom.generic.result.textContent;
    let message = "Copied to clipboard.";
    let notifType = "success";
    if (navigator.clipboard) {
        navigator.clipboard.writeText(result);
    } else {
        message = "Error while copying to clipboard.";
        notifType = "error";
    }
    showNotification(message, notifType, true);
}

function wrapText() {
    dom.generic.result.style.whiteSpace = dom.generic.result.style.whiteSpace === "normal" ? "nowrap" : "normal";
}

function refreshDataAction() {
    if (state.isProcessing) { return; }
    state.isProcessing = true;
    vscode.postMessage({ command: "refreshData" });
}

function exportToCSV() {
    if (!state.variable || !state.variable.result) { return; }
    let csvData = '';
    if (state.variable.result.columns && state.variable.result.columns.count > 0) {
        csvData += state.variable.result.columns.list.toString() + "\n";
    }
    if (state.variable.result.rows && state.variable.result.rows.count > 0) {
        state.variable.result.rows.list.forEach(row => { csvData += row.toString() + "\n"; });
    }
    let anchor = document.createElement('a');
    anchor.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData);
    anchor.target = '_blank';
    anchor.download = 'DataTable.csv';
    anchor.click();
    showNotification("Exported in CSV.", "success", true);
}
//#endregion

//#region Notifications
function showNotification(message, type, isAutoClosable) {
    if (!dom.popup.container.classList.contains("show")) {
        if (type === "success") {
            dom.popup.container.classList.add("success");
            showElement(dom.popup.iconSuccess);
        } else if (type === "error") {
            dom.popup.container.classList.add("error");
            showElement(dom.popup.iconError);
        }
        dom.popup.message.textContent = message;
        dom.popup.container.classList.toggle("show");
        if (isAutoClosable) {
            state.popupTimeout = setTimeout(() => closePopup(), POPUP_AUTO_CLOSE_MS);
        }
    }
}

function closePopup() {
    dom.popup.container.classList.toggle("show");
    setTimeout(() => {
        dom.popup.container.classList.remove("success");
        dom.popup.container.classList.remove("error");
        hideElement(dom.popup.iconSuccess);
        hideElement(dom.popup.iconError);
    }, POPUP_TRANSITION_MS);
}
//#endregion

//#region Messaging
function getDataWithConfig(_config) {
    if (state.isProcessing) { return; }
    state.isProcessing = true;
    vscode.postMessage({ command: "getData", text: JSON.stringify(_config) });
}

function getData() {
    if (state.isProcessing) { return; }
    state.isProcessing = true;
    vscode.postMessage({ command: "getData" });
}

function getDataTableWithConfig() {
    getDataWithConfig({
        currentPage: Number(dom.pagination.currentPage.value),
        recordsPerPage: Number(dom.pagination.recordsPerPage.value),
        totalPage: Number(dom.pagination.totalPage.textContent)
    });
}

const messageHandlers = {
    setData: (msg) => setData(msg.data),
    setHeader: (msg) => setDataTableHeader(msg.data),
    appendRows: (msg) => appendRows(msg.data),
    fetchComplete: () => onFetchComplete(),
    showError: (msg) => {
        dom.datatable.name.textContent = msg.varName || "";
        showError(msg.message || "An unknown error occurred.");
        state.isProcessing = false;
    }
};

window.addEventListener("message", (event) => {
    const handler = messageHandlers[event.data.command];
    if (handler) { handler(event.data); }
});
//#endregion

//#region Event Listeners
dom.buttons.wordWrap.addEventListener("click", () => wrapText());
dom.buttons.copy.addEventListener("click", () => copyToClipBoard());
dom.buttons.refresh.addEventListener("click", () => refreshDataAction());
dom.buttons.export.addEventListener("click", () => exportToCSV());
dom.popup.iconClose.addEventListener("click", () => { clearTimeout(state.popupTimeout); closePopup(); });

dom.pagination.currentPage.addEventListener("keyup", (event) => {
    if (state.isProcessing) { dom.pagination.currentPage.value = state.oldCurrentPage; return; }
    if (event.key === "Enter") {
        const val = Number(dom.pagination.currentPage.value);
        const total = Number(dom.pagination.totalPage.textContent);
        if (val % 1 !== 0) {
            showNotification("Current page can not be a decimal value.", "error", true);
            dom.pagination.currentPage.value = state.oldCurrentPage;
        } else if (val < 1) {
            showNotification("Current page can not be less than 1.", "error", true);
            dom.pagination.currentPage.value = state.oldCurrentPage;
        } else if (val > total) {
            showNotification("Current page can not be more than total pages.", "error", true);
            dom.pagination.currentPage.value = state.oldCurrentPage;
        } else {
            getDataTableWithConfig();
        }
    }
});

dom.pagination.recordsPerPage.addEventListener("change", () => {
    if (!state.isProcessing) { getDataTableWithConfig(); }
});

dom.pagination.firstBtn.addEventListener("click", () => {
    if (state.isProcessing || Number(dom.pagination.currentPage.value) <= 1) { return; }
    dom.pagination.currentPage.value = 1;
    state.oldCurrentPage = dom.pagination.currentPage.value;
    getDataTableWithConfig();
    togglePreviousOrNextPageBtn();
});

dom.pagination.prevBtn.addEventListener("click", () => {
    if (state.isProcessing || Number(dom.pagination.currentPage.value) <= 1) { return; }
    dom.pagination.currentPage.value = Number(dom.pagination.currentPage.value) - 1;
    state.oldCurrentPage = dom.pagination.currentPage.value;
    getDataTableWithConfig();
    togglePreviousOrNextPageBtn();
});

dom.pagination.nextBtn.addEventListener("click", () => {
    if (state.isProcessing || Number(dom.pagination.currentPage.value) >= Number(dom.pagination.totalPage.textContent)) { return; }
    dom.pagination.currentPage.value = Number(dom.pagination.currentPage.value) + 1;
    state.oldCurrentPage = dom.pagination.currentPage.value;
    getDataTableWithConfig();
    togglePreviousOrNextPageBtn();
});

dom.pagination.lastBtn.addEventListener("click", () => {
    if (state.isProcessing || Number(dom.pagination.currentPage.value) >= Number(dom.pagination.totalPage.textContent)) { return; }
    dom.pagination.currentPage.value = Number(dom.pagination.totalPage.textContent);
    state.oldCurrentPage = dom.pagination.currentPage.value;
    getDataTableWithConfig();
    togglePreviousOrNextPageBtn();
});
//#endregion

// Initialize
getData();
