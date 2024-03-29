// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.
if (window.location.href.endsWith('popup.html')) {
const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');

// Listen for changes made to the textbox.
inputElement.addEventListener('input', (event) => {

    // Bundle the input data into a message.
    const message = {
        action: 'classify',
        text: event.target.value,
    }

    // Send this message to the service worker.
    chrome.runtime.sendMessage(message, (response) => {
        // Handle results returned by the service worker (`background.js`) and update the popup's UI.
        outputElement.innerText = JSON.stringify(response, null, 2);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var editButton = document.getElementById('edit-documents-button');
    editButton.addEventListener('click', function() {
        // window.open('editDocuments.html', '_blank');
        window.location.href = 'editDocuments.html';

    });
});
}