const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell, dialog } = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs');
const Store = require('./Store');

// Constants
const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

// Default audio destination folder
const DEFAULT_DESTINATION = path.join(os.homedir(), 'audios');

// User preferences store
const preferences = new Store({
    configName: 'user-preferences',
    defaults: {
        destination: DEFAULT_DESTINATION
    }
});

let destination = preferences.get('destination');

/**
 * Ensures the destination directory exists
 */
function ensureDestinationExists() {
    if (!fs.existsSync(destination)) {
        try {
            fs.mkdirSync(destination, { recursive: true });
        } catch (error) {
            console.error('Failed to create destination directory:', error);
            destination = DEFAULT_DESTINATION;
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }
        }
    }
}

/**
 * Creates the preferences window
 */
function createPreferencesWindow() {
    const preferenceWindow = new BrowserWindow({
        width: isDev ? 980 : 500,
        height: 150,
        resizable: isDev,
        backgroundColor: '#0f172a',
        show: false,
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    preferenceWindow.loadFile('./src/preferences/index.html');

    preferenceWindow.once('ready-to-show', () => {
        preferenceWindow.show();
        if (isDev) {
            preferenceWindow.webContents.openDevTools();
        }
        preferenceWindow.webContents.send('dest-path-update', destination);
    });
}

/**
 * Creates the main application window
 */
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: isDev ? 980 : 500,
        height: 300,
        resizable: isDev,
        backgroundColor: '#0f172a',
        show: false,
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('./src/mainWindow/index.html');

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    setupApplicationMenu();
}

/**
 * Sets up the application menu
 */
function setupApplicationMenu() {
    const menuTemplate = [
        {
            label: app.name,
            submenu: [
                {
                    label: 'Preferences',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => createPreferencesWindow()
                },
                {
                    label: 'Open destination folder',
                    click: () => shell.openPath(destination)
                }
            ]
        },
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// App lifecycle events
app.whenReady().then(() => {
    ensureDestinationExists();
    createMainWindow();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// IPC handlers
ipcMain.on('open_new_window', () => {
    createMainWindow();
});

ipcMain.on('save_buffer', (event, buffer) => {
    try {
        ensureDestinationExists();
        const fileName = `recording_${Date.now()}.webm`;
        const filePath = path.join(destination, fileName);
        fs.writeFileSync(filePath, buffer);
    } catch (error) {
        console.error('Failed to save recording:', error);
    }
});

ipcMain.handle('show-dialog', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select destination folder for recordings'
    });

    if (result.canceled || result.filePaths.length === 0) {
        return destination;
    }

    const dirPath = result.filePaths[0];
    preferences.set('destination', dirPath);
    destination = dirPath;
    return destination;
});