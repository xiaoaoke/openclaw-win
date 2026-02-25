/**
 * 配置服务 — 读写 OpenClaw JSON5 配置文件
 * 处理 ~/.openclaw/openclaw.json 的解析、修改和持久化
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

export interface OpenClawConfig {
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

class ConfigService {
    private configPath: string
    private config: OpenClawConfig | null = null
    private watcher: fs.FSWatcher | null = null

    constructor() {
        const home = process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw')
        this.configPath = path.join(home, 'openclaw.json')
    }

    /** 获取配置文件路径 */
    getConfigPath(): string {
        return this.configPath
    }

    /** 获取 OpenClaw Home 目录 */
    getHomePath(): string {
        return path.dirname(this.configPath)
    }

    /** 检查配置文件是否存在 */
    exists(): boolean {
        return fs.existsSync(this.configPath)
    }

    /** 读取完整配置 */
    read(): OpenClawConfig {
        try {
            if (!fs.existsSync(this.configPath)) {
                return this.getDefaultConfig()
            }
            const raw = fs.readFileSync(this.configPath, 'utf-8')
            // 简单的 JSON5 兼容处理：移除注释和尾逗号
            const cleaned = raw
                .replace(/\/\/.*$/gm, '')        // 移除单行注释
                .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
                .replace(/,(\s*[}\]])/g, '$1')    // 移除尾逗号
            this.config = JSON.parse(cleaned)
            return this.config!
        } catch (err: any) {
            console.error('Failed to read config:', err.message)
            return this.getDefaultConfig()
        }
    }

    /** 写入完整配置 */
    write(config: OpenClawConfig): boolean {
        try {
            const dir = path.dirname(this.configPath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            const content = JSON.stringify(config, null, 2)
            fs.writeFileSync(this.configPath, content, 'utf-8')
            this.config = config
            return true
        } catch (err: any) {
            console.error('Failed to write config:', err.message)
            return false
        }
    }

    /** 获取指定配置路径的值 (支持 dot path, 如 "agents.defaults.model") */
    get(keyPath: string): any {
        const config = this.read()
        const keys = keyPath.split('.')
        let current: any = config
        for (const key of keys) {
            if (current === undefined || current === null) return undefined
            current = current[key]
        }
        return current
    }

    /** 设置指定配置路径的值 */
    set(keyPath: string, value: any): boolean {
        const config = this.read()
        const keys = keyPath.split('.')
        let current: any = config
        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) {
                current[keys[i]] = {}
            }
            current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        return this.write(config)
    }

    /** 获取所有已配置渠道 */
    getChannels(): Record<string, any> {
        const config = this.read()
        return config.channels || {}
    }

    /** 设置渠道配置 */
    setChannel(channelId: string, channelConfig: any): boolean {
        return this.set(`channels.${channelId}`, channelConfig)
    }

    /** 移除渠道 */
    removeChannel(channelId: string): boolean {
        const config = this.read()
        if (config.channels) {
            delete config.channels[channelId]
            return this.write(config)
        }
        return true
    }

    /** 获取环境变量配置 */
    getEnvVars(): Record<string, string> {
        const envPath = path.join(this.getHomePath(), '.env')
        const vars: Record<string, string> = {}
        try {
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf-8')
                content.split('\n').forEach(line => {
                    const trimmed = line.trim()
                    if (trimmed && !trimmed.startsWith('#')) {
                        const [key, ...valueParts] = trimmed.split('=')
                        if (key) {
                            vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                        }
                    }
                })
            }
        } catch { /* ignore */ }
        return vars
    }

    /** 设置环境变量 */
    setEnvVar(key: string, value: string): boolean {
        const envPath = path.join(this.getHomePath(), '.env')
        try {
            const vars = this.getEnvVars()
            vars[key] = value
            const content = Object.entries(vars)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n')
            fs.writeFileSync(envPath, content + '\n', 'utf-8')
            return true
        } catch {
            return false
        }
    }

    /** 监听配置文件变化 */
    watch(callback: (config: OpenClawConfig) => void): void {
        if (this.watcher) this.watcher.close()
        try {
            this.watcher = fs.watch(this.configPath, { persistent: false }, () => {
                setTimeout(() => {
                    const config = this.read()
                    callback(config)
                }, 100) // debounce
            })
        } catch { /* ignore if file doesn't exist yet */ }
    }

    /** 停止监听 */
    unwatch(): void {
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null
        }
    }

    /** 列出工作区中的技能/提示文件 */
    listWorkspaceFiles(): string[] {
        const config = this.read()
        const workspace = config.agents?.defaults?.workspace || path.join(this.getHomePath(), 'workspace')
        try {
            if (!fs.existsSync(workspace)) return []
            return fs.readdirSync(workspace, { recursive: true })
                .map(f => String(f))
                .filter(f => !f.startsWith('.'))
        } catch {
            return []
        }
    }

    private getDefaultConfig(): OpenClawConfig {
        return {
            agents: {
                defaults: {
                    model: 'anthropic/claude-opus-4-6',
                    workspace: path.join(this.getHomePath(), 'workspace')
                }
            },
            channels: {},
            gateway: {
                port: 18789,
                host: '127.0.0.1'
            }
        }
    }
}

export const configService = new ConfigService()
