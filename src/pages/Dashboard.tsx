import { useEffect, useRef } from 'react'
import styles from './Dashboard.module.css'
import { RefreshCw, Activity, Play, Square } from 'lucide-react'
import { useGateway } from '../hooks/useGateway'

const SESSIONS = [
    { id: 1, platform: 'whatsapp', name: 'WhatsApp · 主会话', meta: 'dm:+86 138****7890 · Claude Opus 4.6', time: '2分钟前', status: 'active' },
    { id: 2, platform: 'telegram', name: 'Telegram · 工作群组', meta: 'group:开发讨论 · GPT-5.2', time: '15分钟前', status: 'active' },
    { id: 3, platform: 'discord', name: 'Discord · 技术频道', meta: 'guild:OpenClaw社区 · Claude Sonnet', time: '32分钟前', status: 'active' },
    { id: 4, platform: 'slack', name: 'Slack · #general', meta: 'channel:general · Claude Opus 4.6', time: '1小时前', status: 'idle' },
    { id: 5, platform: 'webchat', name: 'WebChat · 本地调试', meta: 'webchat:local · Claude Opus 4.6', time: '3小时前', status: 'idle' },
]

const FALLBACK_LOGS = [
    { time: '10:25:43', level: 'info' as const, message: 'Gateway started on ws://127.0.0.1:18789', source: 'gateway' },
    { time: '10:25:44', level: 'info' as const, message: 'WhatsApp channel connected · device linked', source: 'whatsapp' },
    { time: '10:25:45', level: 'info' as const, message: 'Telegram bot @openclaw_bot online · polling mode', source: 'telegram' },
    { time: '10:26:12', level: 'warn' as const, message: 'Discord rate limit approaching · 48/50 requests', source: 'discord' },
    { time: '10:27:03', level: 'info' as const, message: 'Agent response completed · 2,340 tokens · 3.2s', source: 'agent' },
    { time: '10:28:15', level: 'debug' as const, message: 'Session pruning: removed 3 stale sessions', source: 'session' },
]

const PLATFORM_ICONS: Record<string, string> = {
    whatsapp: '💬', telegram: '✈️', discord: '🎮', slack: '📋', webchat: '🦞'
}

export default function Dashboard() {
    const { status, logs, loading, start, stop, restart, isRunning, formatUptime } = useGateway()
    const logsEndRef = useRef<HTMLDivElement>(null)

    // 使用实际日志或 fallback
    const displayLogs = logs.length > 0 ? logs.slice(-8) : FALLBACK_LOGS

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [displayLogs])

    const handleGatewayAction = async () => {
        if (loading) return
        if (isRunning) await stop()
        else await start()
    }

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    仪表盘 / <span className={styles.current}>概览</span>
                </div>
                <div className={styles.actions}>
                    <button className={styles.btn}><RefreshCw size={14} /> 刷新</button>
                    <button className={styles.btn}><Activity size={14} /> 诊断</button>
                    <button
                        className={`${styles.btn} ${isRunning ? styles.btnDanger : styles.btnPrimary}`}
                        onClick={handleGatewayAction}
                        disabled={loading}
                    >
                        {isRunning ? <><Square size={14} /> 停止 Gateway</> : <><Play size={14} /> 启动 Gateway</>}
                    </button>
                </div>
            </div>

            <div className={styles.scrollArea}>
                {/* Stat Cards */}
                <div className={styles.statRow}>
                    {[
                        { icon: '📲', label: '渠道', value: '5', sub: '/8', desc: '已连接 · ↑ 2 本周新增', descClass: 'up' },
                        { icon: '💬', label: '活跃会话', value: '12', sub: '', desc: '进行中 · 3 个群组', descClass: '' },
                        { icon: '⚡', label: 'Token 消耗', value: '45.2K', sub: '', desc: '今日 · ↓ 12% 较昨日', descClass: 'up' },
                        { icon: '🖥', label: '设备节点', value: '3', sub: '', desc: '在线 · macOS + iOS + Android', descClass: '' },
                    ].map((stat, i) => (
                        <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className={styles.statHeader}>
                                <div className={styles.statIcon}>{stat.icon}</div>
                                <div className={styles.statLabel}>{stat.label}</div>
                            </div>
                            <div className={styles.statValue}>
                                {stat.value}<span className={styles.statSub}>{stat.sub}</span>
                            </div>
                            <div className={`${styles.statDesc} ${stat.descClass === 'up' ? styles.descUp : ''}`}>
                                {stat.desc}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gateway Status Banner */}
                <div className={`${styles.gatewayBanner} ${isRunning ? styles.bannerRunning : ''}`}>
                    <div className={styles.bannerLeft}>
                        <div className={`${styles.bannerDot} ${isRunning ? styles.dotActive : ''}`} />
                        <div>
                            <div className={styles.bannerTitle}>
                                Gateway {status.status === 'running' ? '运行中' : status.status === 'starting' ? '启动中...' : status.status === 'error' ? '错误' : '已停止'}
                            </div>
                            <div className={styles.bannerMeta}>
                                Port: {status.port}
                                {status.pid ? ` · PID: ${status.pid}` : ''}
                                {status.uptime ? ` · 运行: ${formatUptime(status.uptime)}` : ''}
                                {status.error ? ` · ⚠ ${status.error}` : ''}
                            </div>
                        </div>
                    </div>
                    <button className={styles.btnSmall} onClick={() => restart()} disabled={loading}>
                        <RefreshCw size={12} /> 重启
                    </button>
                </div>

                {/* Two Column */}
                <div className={styles.columns}>
                    {/* Sessions */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>⚡ 活跃会话</div>
                            <span className={styles.badge}>12</span>
                        </div>
                        <div className={styles.panelBody}>
                            {SESSIONS.map(s => (
                                <div key={s.id} className={styles.sessionItem}>
                                    <div className={`${styles.sessionIcon} ${styles[s.platform]}`}>
                                        {PLATFORM_ICONS[s.platform]}
                                    </div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionName}>{s.name}</div>
                                        <div className={styles.sessionMeta}>{s.meta}</div>
                                    </div>
                                    <div className={styles.sessionTime}>{s.time}</div>
                                    <div className={`${styles.sessionDot} ${styles[s.status]}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}>📊 Token 使用趋势</div>
                            <div className={styles.chartTabs}>
                                <span className={styles.chartTab}>24h</span>
                                <span className={`${styles.chartTab} ${styles.chartTabActive}`}>7天</span>
                                <span className={styles.chartTab}>30天</span>
                            </div>
                        </div>
                        <div className={styles.chartArea}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartValue}>312.8K <span className={styles.chartUnit}>tokens</span></div>
                                    <div className={styles.chartTrend}>↓ 8.3% 较上周</div>
                                </div>
                            </div>
                            <div className={styles.chartCanvas}>
                                <svg viewBox="0 0 500 120" preserveAspectRatio="none" className={styles.chartSvg}>
                                    <defs>
                                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(255,69,0,0.35)" />
                                            <stop offset="100%" stopColor="rgba(255,69,0,0)" />
                                        </linearGradient>
                                    </defs>
                                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.04)" />
                                    <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.04)" />
                                    <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.04)" />
                                    <path d="M0,90 C30,85 60,70 100,55 C140,40 170,30 210,45 C250,60 280,35 320,25 C360,15 390,40 430,50 C460,58 490,42 500,38 L500,120 L0,120 Z" fill="url(#cg)" />
                                    <path d="M0,90 C30,85 60,70 100,55 C140,40 170,30 210,45 C250,60 280,35 320,25 C360,15 390,40 430,50 C460,58 490,42 500,38" fill="none" stroke="var(--claw-red)" strokeWidth="2.5" strokeLinecap="round" />
                                    <circle cx="100" cy="55" r="3" fill="var(--claw-red)" />
                                    <circle cx="210" cy="45" r="3" fill="var(--claw-red)" />
                                    <circle cx="320" cy="25" r="4" fill="var(--claw-red)" stroke="var(--bg-secondary)" strokeWidth="2" />
                                    <circle cx="430" cy="50" r="3" fill="var(--claw-red)" />
                                    <text x="50" y="115" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-ui)" textAnchor="middle">周一</text>
                                    <text x="150" y="115" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-ui)" textAnchor="middle">周二</text>
                                    <text x="250" y="115" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-ui)" textAnchor="middle">周三</text>
                                    <text x="350" y="115" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-ui)" textAnchor="middle">周四</text>
                                    <text x="450" y="115" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-ui)" textAnchor="middle">周五</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs — now using real gateway logs */}
                <div className={styles.logsPanel}>
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitle}>📋 实时日志</div>
                    </div>
                    {displayLogs.map((log, i) => (
                        <div key={i} className={styles.logLine}>
                            <span className={styles.logTime}>{log.time}</span>
                            <span className={`${styles.logLevel} ${styles[log.level]}`}>{log.level.toUpperCase()}</span>
                            <span className={styles.logMsg}>{log.message}</span>
                            <span className={styles.logSource}>{log.source}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    )
}
