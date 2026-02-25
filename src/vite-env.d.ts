/// <reference types="vite/client" />

declare global {
    interface GatewayLog {
        time: string
        level: 'info' | 'warn' | 'error' | 'debug'
        message: string
        source: string
    }

    interface GatewayStatus {
        status: 'running' | 'stopped' | 'starting' | 'error'
        pid?: number
        port: number
        uptime?: number
        error?: string
    }

    interface OpenClawConfig {
        agents?: {
            defaults?: {
                model?: string
                models?: string[]
                workspace?: string
            }
        }
        channels?: Record<string, any>
        gateway?: {
            port?: number
            host?: string
        }
        security?: {
            sandbox?: string
        }
        [key: string]: any
    }

    interface ElectronAPI {
        // Window controls
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>

        // CLI operations
        execute: (command: string, args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>
        which: (cmd: string) => Promise<boolean>

        // System info
        getSystemInfo: () => Promise<{
            platform: string
            arch: string
            nodeVersion: string
            electronVersion: string
            homeDir: string
            appDataDir: string
        }>
        openPath: (path: string) => Promise<void>

        // Gateway management
        gateway: {
            start: (port?: number) => Promise<GatewayStatus>
            stop: () => Promise<GatewayStatus>
            restart: (port?: number) => Promise<GatewayStatus>
            status: () => Promise<GatewayStatus>
            logs: (limit?: number) => Promise<GatewayLog[]>
            onStatusChanged: (cb: (status: GatewayStatus) => void) => () => void
            onLog: (cb: (log: GatewayLog) => void) => () => void
        }

        // Config management
        config: {
            read: () => Promise<OpenClawConfig>
            write: (cfg: OpenClawConfig) => Promise<boolean>
            get: (keyPath: string) => Promise<any>
            set: (keyPath: string, value: any) => Promise<boolean>
            path: () => Promise<{ configPath: string; homePath: string; exists: boolean }>
            channels: () => Promise<Record<string, any>>
            setChannel: (id: string, cfg: any) => Promise<boolean>
            removeChannel: (id: string) => Promise<boolean>
            envVars: () => Promise<Record<string, string>>
            setEnvVar: (key: string, value: string) => Promise<boolean>
            onChanged: (cb: (cfg: OpenClawConfig) => void) => () => void
        }

        // Workspace
        workspace: {
            files: () => Promise<string[]>
        }

        // Platform
        platform: string
    }

    interface Window {
        electronAPI: ElectronAPI
    }
}

export { }
