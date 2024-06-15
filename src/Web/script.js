//#region Initialzation
var genericTypeName = document.getElementById("generic-type-name");
var genericTypeResult = document.getElementById("generic-type-result");

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

//#region Listners
window.addEventListener("message", (event) => {
  console.log(event);
  const message = event.data; // The JSON data our extension sent
  switch (message.command) {
    case "setData":
      genericTypeName.innerHTML = message.data.varName;
      genericTypeResult.innerHTML = message.data.result;
      setData();
      break;
  }
});

btnWordWrap.addEventListener("click", function () {
  console.log(genericTypeResult.style);
});

btnCopy.addEventListener("click", function () {
  copyToClipBoard();
});

iconClose.addEventListener("click", function () {
  clearTimeout(popupTimeout);
  closePopup();
});
//#endregion

function setData() {}

//#region Control - Functions
function copyToClipBoard() {
  var result = genericTypeResult.innerHTML;
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
    setTimeout(function()
    {
        popupContainer.classList.remove("success");
        popupContainer.classList.remove("error");
        iconSuccess.style.display = "none";
        iconError.style.display = "none";
    }, 500);
}

function getData() {
    vscode.postMessage({
      command: "getData",
    });
}
