/**
 * useGateway — Gateway 管理 Hook
 * 封装 Gateway 的启动/停止/重启操作，实时状态和日志订阅
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

const api = () => window.electronAPI

export function useGateway() {
    const { setGatewayStatus } = useAppStore()
    const [status, setStatus] = useState<GatewayStatus>({ status: 'stopped', port: 18789 })
    const [logs, setLogs] = useState<GatewayLog[]>([])
    const [loading, setLoading] = useState(false)
    const cleanupRef = useRef<(() => void)[]>([])

    // 初始化：获取当前状态和日志
    useEffect(() => {
        if (!api()?.gateway) return

        api().gateway.status().then(s => {
            setStatus(s)
            setGatewayStatus(s.status)
        }).catch(() => { })

        api().gateway.logs(100).then(l => {
            setLogs(l)
        }).catch(() => { })

        // 订阅状态变更
        const unsubStatus = api().gateway.onStatusChanged((s) => {
            setStatus(s)
            setGatewayStatus(s.status)
        })
        cleanupRef.current.push(unsubStatus)

        // 订阅新日志
        const unsubLog = api().gateway.onLog((log) => {
            setLogs(prev => {
                const next = [...prev, log]
                return next.length > 200 ? next.slice(-200) : next
            })
        })
        cleanupRef.current.push(unsubLog)

        return () => {
            cleanupRef.current.forEach(fn => fn())
            cleanupRef.current = []
        }
    }, [])

    const start = useCallback(async (port?: number) => {
        if (!api()?.gateway) return
        setLoading(true)
        try {
            const result = await api().gateway.start(port)
            setStatus(result)
            setGatewayStatus(result.status)
        } finally {
            setLoading(false)
        }
    }, [])

    const stop = useCallback(async () => {
        if (!api()?.gateway) return
        setLoading(true)
        try {
            const result = await api().gateway.stop()
            setStatus(result)
            setGatewayStatus(result.status)
        } finally {
            setLoading(false)
        }
    }, [])

    const restart = useCallback(async (port?: number) => {
        if (!api()?.gateway) return
        setLoading(true)
        try {
            const result = await api().gateway.restart(port)
            setStatus(result)
            setGatewayStatus(result.status)
        } finally {
            setLoading(false)
        }
    }, [])

    const clearLogs = useCallback(() => setLogs([]), [])

    const formatUptime = useCallback((ms?: number) => {
        if (!ms) return '—'
        const secs = Math.floor(ms / 1000)
        const mins = Math.floor(secs / 60)
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 24)
        if (days > 0) return `${days}天 ${hours % 24}小时`
        if (hours > 0) return `${hours}小时 ${mins % 60}分钟`
        if (mins > 0) return `${mins}分钟`
        return `${secs}秒`
    }, [])

    return {
        status,
        logs,
        loading,
        start,
        stop,
        restart,
        clearLogs,
        formatUptime,
        isRunning: status.status === 'running',
        isStopped: status.status === 'stopped',
        isStarting: status.status === 'starting',
        isError: status.status === 'error',
    }
}
