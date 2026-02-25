import { useState, useEffect } from 'react'
import { useGateway } from '../../hooks/useGateway'
import styles from './StatusBar.module.css'
import { Wifi, WifiOff, Cpu, Clock, Zap } from 'lucide-react'

export default function StatusBar() {
    const { status, isRunning, formatUptime } = useGateway()
    const [time, setTime] = useState(new Date())
    const [memUsage, setMemUsage] = useState('—')

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Periodically refresh uptime display
    useEffect(() => {
        if (!isRunning) return
        const timer = setInterval(() => {
            // Force re-render for uptime
            setTime(new Date())
        }, 5000)
        return () => clearInterval(timer)
    }, [isRunning])

    // Simulate memory usage (would use real data from IPC in production)
    useEffect(() => {
        const updateMem = () => {
            const base = 85 + Math.random() * 40
            setMemUsage(`${base.toFixed(0)} MB`)
        }
        updateMem()
        const timer = setInterval(updateMem, 10000)
        return () => clearInterval(timer)
    }, [])

    const statusText = {
        running: 'Running',
        stopped: 'Stopped',
        starting: 'Starting...',
        error: 'Error'
    }[status.status]

    return (
        <div className={styles.statusbar}>
            {/* Left section */}
            <div className={styles.section}>
                <div className={`${styles.item} ${styles.gatewayItem}`}>
                    <div className={`${styles.dot} ${styles[status.status]}`} />
                    {isRunning ? <Wifi size={11} /> : <WifiOff size={11} />}
                    <span>Gateway: {statusText}</span>
                </div>
                <div className={styles.separator} />
                <div className={styles.item}>
                    <Zap size={11} />
                    <span>Port: {status.port}</span>
                </div>
                {status.pid && (
                    <>
                        <div className={styles.separator} />
                        <div className={styles.item}>
                            <Cpu size={11} />
                            <span>PID: {status.pid}</span>
                        </div>
                    </>
                )}
                {isRunning && status.uptime && (
                    <>
                        <div className={styles.separator} />
                        <div className={styles.item}>
                            <Clock size={11} />
                            <span>运行: {formatUptime(status.uptime)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Right section */}
            <div className={styles.section}>
                <div className={styles.item}>
                    <span>内存: {memUsage}</span>
                </div>
                <div className={styles.separator} />
                <div className={styles.item}>
                    <span>{time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={styles.separator} />
                <div className={styles.item}>
                    <span>v0.1.0</span>
                </div>
            </div>
        </div>
    )
}
