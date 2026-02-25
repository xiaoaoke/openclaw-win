/**
 * Gateway 服务 — 管理 OpenClaw Gateway 进程的生命周期
 * 负责启动、停止、重启 Gateway，以及监听其输出日志
 */
import { ChildProcess, spawn, exec } from 'child_process'
import { EventEmitter } from 'events'
import path from 'path'
import os from 'os'

export interface GatewayLog {
    time: string
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    source: string
}

export interface GatewayStatus {
    status: 'running' | 'stopped' | 'starting' | 'error'
    pid?: number
    port: number
    uptime?: number // ms
    error?: string
}

class GatewayService extends EventEmitter {
    private process: ChildProcess | null = null
    private status: GatewayStatus = { status: 'stopped', port: 18789 }
    private startTime: number = 0
    private logs: GatewayLog[] = []
    private maxLogs = 500

    getStatus(): GatewayStatus {
        if (this.status.status === 'running' && this.startTime) {
            this.status.uptime = Date.now() - this.startTime
        }
        return { ...this.status }
    }

    getLogs(limit = 50): GatewayLog[] {
        return this.logs.slice(-limit)
    }

    async start(port = 18789): Promise<GatewayStatus> {
        if (this.process && this.status.status === 'running') {
            return this.getStatus()
        }

        this.status = { status: 'starting', port }
        this.emit('status', this.getStatus())

        return new Promise((resolve) => {
            try {
                // Attempt to spawn the openclaw gateway process
                this.process = spawn('openclaw', ['gateway', '--port', String(port)], {
                    shell: true,
                    env: {
                        ...process.env,
                        OPENCLAW_HOME: this.getOpenClawHome(),
                        NODE_ENV: 'production'
                    },
                    stdio: ['pipe', 'pipe', 'pipe']
                })

                this.startTime = Date.now()

                this.process.stdout?.on('data', (data: Buffer) => {
                    const lines = data.toString().split('\n').filter(Boolean)
                    lines.forEach(line => this.parseLog(line))
                })

                this.process.stderr?.on('data', (data: Buffer) => {
                    const lines = data.toString().split('\n').filter(Boolean)
                    lines.forEach(line => this.parseLog(line, 'error'))
                })

                this.process.on('close', (code) => {
                    const wasRunning = this.status.status === 'running'
                    this.status = {
                        status: code === 0 || !wasRunning ? 'stopped' : 'error',
                        port,
                        error: code !== 0 ? `Process exited with code ${code}` : undefined
                    }
                    this.process = null
                    this.startTime = 0
                    this.emit('status', this.getStatus())
                    this.addLog('info', `Gateway 进程已退出 (code: ${code})`, 'system')
                })

                this.process.on('error', (err) => {
                    this.status = { status: 'error', port, error: err.message }
                    this.process = null
                    this.emit('status', this.getStatus())
                    this.addLog('error', `Gateway 启动失败: ${err.message}`, 'system')
                    resolve(this.getStatus())
                })

                // Give it a moment to start, then mark as running
                setTimeout(() => {
                    if (this.process && !this.process.killed) {
                        this.status = {
                            status: 'running',
                            port,
                            pid: this.process.pid,
                            uptime: Date.now() - this.startTime
                        }
                        this.emit('status', this.getStatus())
                        this.addLog('info', `Gateway started on ws://127.0.0.1:${port}`, 'gateway')
                    }
                    resolve(this.getStatus())
                }, 2000)

            } catch (err: any) {
                this.status = { status: 'error', port, error: err.message }
                this.emit('status', this.getStatus())
                resolve(this.getStatus())
            }
        })
    }

    async stop(): Promise<GatewayStatus> {
        if (!this.process) {
            this.status = { ...this.status, status: 'stopped' }
            this.emit('status', this.getStatus())
            return this.getStatus()
        }

        return new Promise((resolve) => {
            this.addLog('info', 'Stopping Gateway...', 'system')

            // Try graceful shutdown first
            if (process.platform === 'win32') {
                exec(`taskkill /PID ${this.process!.pid} /T /F`, () => {
                    this.status = { ...this.status, status: 'stopped' }
                    this.process = null
                    this.startTime = 0
                    this.emit('status', this.getStatus())
                    this.addLog('info', 'Gateway 已停止', 'system')
                    resolve(this.getStatus())
                })
            } else {
                this.process!.kill('SIGTERM')
                setTimeout(() => {
                    if (this.process && !this.process.killed) {
                        this.process.kill('SIGKILL')
                    }
                    this.status = { ...this.status, status: 'stopped' }
                    this.process = null
                    this.startTime = 0
                    this.emit('status', this.getStatus())
                    this.addLog('info', 'Gateway 已停止', 'system')
                    resolve(this.getStatus())
                }, 3000)
            }
        })
    }

    async restart(port?: number): Promise<GatewayStatus> {
        this.addLog('info', 'Restarting Gateway...', 'system')
        await this.stop()
        return this.start(port || this.status.port)
    }

    private parseLog(raw: string, defaultLevel: GatewayLog['level'] = 'info') {
        let level = defaultLevel
        let message = raw.trim()

        if (message.includes('[INFO]') || message.includes('info')) level = 'info'
        else if (message.includes('[WARN]') || message.includes('warn')) level = 'warn'
        else if (message.includes('[ERROR]') || message.includes('error')) level = 'error'
        else if (message.includes('[DEBUG]') || message.includes('debug')) level = 'debug'

        const source = this.detectSource(message)
        this.addLog(level, message, source)
    }

    private detectSource(msg: string): string {
        if (msg.includes('whatsapp')) return 'whatsapp'
        if (msg.includes('telegram')) return 'telegram'
        if (msg.includes('discord')) return 'discord'
        if (msg.includes('slack')) return 'slack'
        if (msg.includes('webchat')) return 'webchat'
        if (msg.includes('agent')) return 'agent'
        return 'gateway'
    }

    private addLog(level: GatewayLog['level'], message: string, source: string) {
        const log: GatewayLog = {
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            level, message, source
        }
        this.logs.push(log)
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }
        this.emit('log', log)
    }

    private getOpenClawHome(): string {
        return process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw')
    }

    destroy() {
        if (this.process) {
            this.process.kill('SIGKILL')
            this.process = null
        }
    }
}

export const gatewayService = new GatewayService()
