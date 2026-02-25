import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { spawn, exec } from 'child_process'
import { registerIpcHandlers, cleanupIpc } from './ipc/handlers'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#060D1A',
        icon: path.join(process.env.VITE_PUBLIC!, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })

    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
    }
}

// ─── 基础 IPC ──────────────────────────────────────────────

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
})
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

// CLI command execution
ipcMain.handle('cli:execute', async (_event, command: string, args: string[]) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            shell: true,
            env: { ...process.env }
        })
        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => { stdout += data.toString() })
        child.stderr.on('data', (data) => { stderr += data.toString() })
        child.on('close', (code) => {
            resolve({ code, stdout, stderr })
        })
        child.on('error', (err) => {
            reject(err.message)
        })
    })
})

// Check if a command exists
ipcMain.handle('cli:which', async (_event, cmd: string) => {
    return new Promise((resolve) => {
        const whichCmd = process.platform === 'win32' ? 'where' : 'which'
        exec(`${whichCmd} ${cmd}`, (error) => {
            resolve(!error)
        })
    })
})

// Get environment info — detect SYSTEM-installed Node.js, not Electron's embedded one
ipcMain.handle('system:info', async () => {
    let systemNodeVersion = ''
    try {
        const { execSync } = require('child_process')
        const output = execSync('node --version', { encoding: 'utf-8', timeout: 5000 }).trim()
        // output is like "v22.3.0" — strip the leading 'v'
        systemNodeVersion = output.startsWith('v') ? output.slice(1) : output
    } catch {
        systemNodeVersion = '' // Node.js not installed on system
    }
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: systemNodeVersion, // real system Node.js version
        electronNodeVersion: process.versions.node, // Electron's embedded Node
        electronVersion: process.versions.electron,
        homeDir: app.getPath('home'),
        appDataDir: app.getPath('appData')
    }
})

// Open a path in file explorer
ipcMain.handle('system:openPath', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
})

// ─── 注册 Gateway & Config IPC ─────────────────────────────
registerIpcHandlers(() => mainWindow)

// ─── App 生命周期 ──────────────────────────────────────────
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    cleanupIpc()
    if (process.platform !== 'darwin') {
        app.quit()
        mainWindow = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('before-quit', () => {
    cleanupIpc()
})
