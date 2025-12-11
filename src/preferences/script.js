const { ipcRenderer } = require('electron');

/**
 * Preferences Window Script - Handles user preferences
 */

// DOM Elements
const destPathInput = document.querySelector('#dest-path');

/**
 * Updates the destination path input with the current value
 * @param {string} destination - The current destination path
 */
function updateDestinationPath(destination) {
    if (destPathInput) {
        destPathInput.value = destination || '';
    }
}

/**
 * Opens a folder selection dialog and updates the destination
 */
async function chooseDestination() {
    try {
        const destination = await ipcRenderer.invoke('show-dialog');
        updateDestinationPath(destination);
    } catch (error) {
        console.error('Error choosing destination:', error);
    }
}

// Listen for destination path updates from main process
ipcRenderer.on('dest-path-update', (event, destination) => {
    updateDestinationPath(destination);
});

// Expose choose function globally for the button onclick
window.choose = chooseDestination;