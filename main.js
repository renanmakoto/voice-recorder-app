const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron')
const os = require('os')
const path = require('path')
const isDev = (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development") ? true : false
const isMac = process.platform === 'darwin' ? true : false

function createWindow() {
    const win = new BrowserWindow({
        width: isDev ? 980 : 500,
        height: 300,
        resizable: isDev ? true : false,
        backgroundColor: "#234",
        show: false,
        icons: path.join(__dirname, "assets", "icons", "icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    win.loadFile('./src/mainWindow/index.html')
    if (isDev) {
        win.webContents.openDevTools()
    }
    win.once('ready-to-show', () => {
        win.show()
        setTimeout(() => {
            win.webContents.send('cpu_name', os.cpus()[0].model)
        }, 3000)
    })

    const menuTemplate = [
        { 
            label: app.name,
            submenu: [
                { label: "Preferences", click: () => {} },
                { label: "Open destination folder", click: () => {} }
            ]
        },
        { 
            label: 'File', 
            submenu: [ isMac ? {role: "close"} : {role: "quit"} ]        
        },
    ]
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
    console.log("The App is ready")
    createWindow()

})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
    console.log("All windows are closed")
    if (!isMac) {
        app.quit()
    }
}) 

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ipcMain.on('open_new_window', () => {
//     createWindow()
// })