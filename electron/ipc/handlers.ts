/**
 * IPC 路由注册 — 将服务层方法映射为 IPC Handler
 * 统一管理所有 IPC 通道的注册，保持 main.ts 简洁
 */
import { ipcMain, BrowserWindow } from 'electron'
import { gatewayService, GatewayLog, GatewayStatus } from '../services/gateway'
import { configService } from '../services/config'

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {

    // ─── Gateway 管理 ──────────────────────────────────────────
    ipcMain.handle('gateway:start', async (_e, port?: number) => {
        return gatewayService.start(port)
    })

    ipcMain.handle('gateway:stop', async () => {
        return gatewayService.stop()
    })

    ipcMain.handle('gateway:restart', async (_e, port?: number) => {
        return gatewayService.restart(port)
    })

    ipcMain.handle('gateway:status', async () => {
        return gatewayService.getStatus()
    })

    ipcMain.handle('gateway:logs', async (_e, limit?: number) => {
        return gatewayService.getLogs(limit)
    })

    // 将 Gateway 事件转发到渲染进程
    gatewayService.on('status', (status: GatewayStatus) => {
        const win = getMainWindow()
        if (win && !win.isDestroyed()) {
            win.webContents.send('gateway:status-changed', status)
        }
    })

    gatewayService.on('log', (log: GatewayLog) => {
        const win = getMainWindow()
        if (win && !win.isDestroyed()) {
            win.webContents.send('gateway:new-log', log)
        }
    })

    // ─── 配置管理 ──────────────────────────────────────────────
    ipcMain.handle('config:read', async () => {
        return configService.read()
    })

    ipcMain.handle('config:write', async (_e, config: any) => {
        return configService.write(config)
    })

    ipcMain.handle('config:get', async (_e, keyPath: string) => {
        return configService.get(keyPath)
    })

    ipcMain.handle('config:set', async (_e, keyPath: string, value: any) => {
        return configService.set(keyPath, value)
    })

    ipcMain.handle('config:path', async () => {
        return {
            configPath: configService.getConfigPath(),
            homePath: configService.getHomePath(),
            exists: configService.exists()
        }
    })

    // ─── 渠道配置 ──────────────────────────────────────────────
    ipcMain.handle('config:channels', async () => {
        return configService.getChannels()
    })

    ipcMain.handle('config:setChannel', async (_e, id: string, cfg: any) => {
        return configService.setChannel(id, cfg)
    })

    ipcMain.handle('config:removeChannel', async (_e, id: string) => {
        return configService.removeChannel(id)
    })

    // ─── 环境变量 ──────────────────────────────────────────────
    ipcMain.handle('config:envVars', async () => {
        return configService.getEnvVars()
    })

    ipcMain.handle('config:setEnvVar', async (_e, key: string, value: string) => {
        return configService.setEnvVar(key, value)
    })

    // ─── 工作区 ────────────────────────────────────────────────
    ipcMain.handle('workspace:files', async () => {
        return configService.listWorkspaceFiles()
    })

    // 监听配置文件变更，转发到渲染进程
    configService.watch((config) => {
        const win = getMainWindow()
        if (win && !win.isDestroyed()) {
            win.webContents.send('config:changed', config)
        }
    })
}

/** 清理：应用退出前调用 */
export function cleanupIpc() {
    gatewayService.destroy()
    configService.unwatch()
}
