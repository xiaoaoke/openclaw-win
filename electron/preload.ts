import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    // ─── Window controls ───────────────────────────────────
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

    // ─── CLI operations ────────────────────────────────────
    execute: (command: string, args: string[]) =>
        ipcRenderer.invoke('cli:execute', command, args),
    which: (cmd: string) =>
        ipcRenderer.invoke('cli:which', cmd),

    // ─── System info ───────────────────────────────────────
    getSystemInfo: () => ipcRenderer.invoke('system:info'),
    openPath: (path: string) => ipcRenderer.invoke('system:openPath', path),

    // ─── Gateway management ────────────────────────────────
    gateway: {
        start: (port?: number) => ipcRenderer.invoke('gateway:start', port),
        stop: () => ipcRenderer.invoke('gateway:stop'),
        restart: (port?: number) => ipcRenderer.invoke('gateway:restart', port),
        status: () => ipcRenderer.invoke('gateway:status'),
        logs: (limit?: number) => ipcRenderer.invoke('gateway:logs', limit),
        onStatusChanged: (cb: (status: any) => void) => {
            const handler = (_e: any, status: any) => cb(status)
            ipcRenderer.on('gateway:status-changed', handler)
            return () => ipcRenderer.removeListener('gateway:status-changed', handler)
        },
        onLog: (cb: (log: any) => void) => {
            const handler = (_e: any, log: any) => cb(log)
            ipcRenderer.on('gateway:new-log', handler)
            return () => ipcRenderer.removeListener('gateway:new-log', handler)
        }
    },

    // ─── Config management ─────────────────────────────────
    config: {
        read: () => ipcRenderer.invoke('config:read'),
        write: (cfg: any) => ipcRenderer.invoke('config:write', cfg),
        get: (keyPath: string) => ipcRenderer.invoke('config:get', keyPath),
        set: (keyPath: string, value: any) => ipcRenderer.invoke('config:set', keyPath, value),
        path: () => ipcRenderer.invoke('config:path'),
        channels: () => ipcRenderer.invoke('config:channels'),
        setChannel: (id: string, cfg: any) => ipcRenderer.invoke('config:setChannel', id, cfg),
        removeChannel: (id: string) => ipcRenderer.invoke('config:removeChannel', id),
        envVars: () => ipcRenderer.invoke('config:envVars'),
        setEnvVar: (key: string, value: string) => ipcRenderer.invoke('config:setEnvVar', key, value),
        onChanged: (cb: (cfg: any) => void) => {
            const handler = (_e: any, cfg: any) => cb(cfg)
            ipcRenderer.on('config:changed', handler)
            return () => ipcRenderer.removeListener('config:changed', handler)
        }
    },

    // ─── Workspace ─────────────────────────────────────────
    workspace: {
        files: () => ipcRenderer.invoke('workspace:files')
    },

    // ─── Platform ──────────────────────────────────────────
    platform: process.platform
})
