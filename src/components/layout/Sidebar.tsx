import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useGateway } from '../../hooks/useGateway'
import styles from './Sidebar.module.css'
import {
    LayoutGrid, MessageSquare, Bot, Wrench,
    MessagesSquare, Settings, Play, Square, RefreshCw
} from 'lucide-react'

type Page = 'dashboard' | 'channels' | 'models' | 'skills' | 'chat' | 'settings'

const navItems: { id: Page; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: LayoutGrid, label: '仪表盘' },
    { id: 'channels', icon: MessageSquare, label: '渠道管理' },
    { id: 'models', icon: Bot, label: '模型管理' },
    { id: 'skills', icon: Wrench, label: '技能市场' },
    { id: 'chat', icon: MessagesSquare, label: '对话' },
]

export default function Sidebar() {
    const { currentPage, setPage } = useAppStore()
    const { status, isRunning, isStarting, loading, start, stop, restart } = useGateway()
    const isOnboarding = currentPage === 'onboarding'
    const [showGwPopup, setShowGwPopup] = useState(false)

    return (
        <nav className={`${styles.sidebar} ${isOnboarding ? styles.dimmed : ''}`}>
            <div className={styles.navGroup}>
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
                            onClick={() => !isOnboarding && setPage(item.id)}
                            title={item.label}
                            disabled={isOnboarding}
                        >
                            <Icon size={20} strokeWidth={1.8} />
                            <span className={styles.tooltip}>{item.label}</span>
                            {currentPage === item.id && <div className={styles.activeBar} />}
                        </button>
                    )
                })}
            </div>

            <div className={styles.spacer} />

            <button
                className={`${styles.navItem} ${currentPage === 'settings' ? styles.active : ''}`}
                onClick={() => !isOnboarding && setPage('settings')}
                title="设置"
                disabled={isOnboarding}
            >
                <Settings size={20} strokeWidth={1.8} />
                <span className={styles.tooltip}>设置</span>
                {currentPage === 'settings' && <div className={styles.activeBar} />}
            </button>

            {/* Gateway Status with popup */}
            <div className={styles.statusWrapper}>
                <button
                    className={styles.status}
                    onClick={() => setShowGwPopup(!showGwPopup)}
                    title="Gateway 状态"
                >
                    <div className={`${styles.statusDot} ${styles[status.status]}`} />
                    <span className={styles.statusLabel}>
                        {isRunning ? '在线' : isStarting ? '启动中' : status.status === 'error' ? '错误' : '离线'}
                    </span>
                </button>

                {showGwPopup && (
                    <div className={styles.gwPopup}>
                        <div className={styles.gwPopupHeader}>
                            <div className={`${styles.gwPopupDot} ${isRunning ? styles.gwPopupActive : ''}`} />
                            <div>
                                <div className={styles.gwPopupTitle}>Gateway</div>
                                <div className={styles.gwPopupMeta}>Port: {status.port}</div>
                            </div>
                        </div>
                        <div className={styles.gwPopupActions}>
                            {isRunning ? (
                                <>
                                    <button className={styles.gwBtn} onClick={() => { stop(); setShowGwPopup(false) }} disabled={loading}>
                                        <Square size={13} /> 停止
                                    </button>
                                    <button className={styles.gwBtn} onClick={() => { restart(); setShowGwPopup(false) }} disabled={loading}>
                                        <RefreshCw size={13} /> 重启
                                    </button>
                                </>
                            ) : (
                                <button className={`${styles.gwBtn} ${styles.gwBtnStart}`} onClick={() => { start(); setShowGwPopup(false) }} disabled={loading}>
                                    <Play size={13} /> 启动
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
