import { useState } from 'react'
import styles from './Channels.module.css'
import { Plus, Search, Power, ChevronRight, Check, X, User } from 'lucide-react'

interface Channel {
    id: string
    name: string
    icon: string
    status: 'connected' | 'configuring' | 'offline'
    meta: string
    color: string
    sessions?: number
    uptime?: string
    driver?: string
}

const CHANNELS: Channel[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', status: 'connected', meta: '3 个活跃会话', color: '#25D366', sessions: 3, uptime: '3 天 12 小时', driver: 'Baileys' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', status: 'connected', meta: '2 个活跃会话', color: '#26A5E4', sessions: 2, uptime: '7 天 3 小时', driver: 'Bot API' },
    { id: 'discord', name: 'Discord', icon: '🎮', status: 'connected', meta: '5 个活跃会话', color: '#5865F2', sessions: 5, uptime: '12 天 8 小时', driver: 'Discord.js' },
    { id: 'slack', name: 'Slack', icon: '📋', status: 'configuring', meta: '正在配置中...', color: '#E01E5A', sessions: 0 },
    { id: 'signal', name: 'Signal', icon: '🛡️', status: 'offline', meta: '未连接', color: '#3B86F7', sessions: 0 },
    { id: 'teams', name: 'MS Teams', icon: '🟦', status: 'offline', meta: '未连接', color: '#5059C9', sessions: 0 },
    { id: 'webchat', name: 'WebChat', icon: '🦞', status: 'connected', meta: '内建 · 始终可用', color: '#FF4500', sessions: 1, uptime: '始终在线', driver: '内建' },
    { id: 'bluebubbles', name: 'BlueBubbles', icon: '🍎', status: 'offline', meta: 'iMessage 集成', color: '#34C759', sessions: 0 },
]

interface PairingRequest {
    id: number
    contact: string
    code: string
    time: string
}

const PAIRING_REQUESTS: PairingRequest[] = [
    { id: 1, contact: '+86 136****9012', code: 'CLAW-8X3P', time: '5 分钟前' },
    { id: 2, contact: '+1 234****5678', code: 'CLAW-Q7M2', time: '23 分钟前' },
]

type TabId = 'overview' | 'config' | 'allowlist' | 'groups' | 'logs'

export default function Channels() {
    const [selected, setSelected] = useState('whatsapp')
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<TabId>('config')
    const [dmPolicy, setDmPolicy] = useState('pairing')
    const [mediaSize, setMediaSize] = useState('16')
    const [allowAll, setAllowAll] = useState(false)
    const [requireMention, setRequireMention] = useState(true)
    const [allowFrom, setAllowFrom] = useState(['+86 138****7890', '+86 139****5678', '+1 555****0123'])
    const [newNumber, setNewNumber] = useState('')
    const [pairings, setPairings] = useState(PAIRING_REQUESTS)
    const [channelEnabled, setChannelEnabled] = useState(true)

    const channel = CHANNELS.find(c => c.id === selected)!
    const filtered = CHANNELS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

    const tabs: { id: TabId; label: string }[] = [
        { id: 'overview', label: '概览' },
        { id: 'config', label: '配置' },
        { id: 'allowlist', label: '白名单' },
        { id: 'groups', label: '群组' },
        { id: 'logs', label: '日志' },
    ]

    const addNumber = () => {
        if (newNumber.trim()) {
            setAllowFrom([...allowFrom, newNumber.trim()])
            setNewNumber('')
        }
    }

    const removeNumber = (idx: number) => {
        setAllowFrom(allowFrom.filter((_, i) => i !== idx))
    }

    const approvePairing = (id: number) => setPairings(pairings.filter(p => p.id !== id))
    const rejectPairing = (id: number) => setPairings(pairings.filter(p => p.id !== id))

    const statusBadgeClass = (s: Channel['status']) =>
        s === 'connected' ? styles.badgeConnected : s === 'configuring' ? styles.badgeConfiguring : styles.badgeOffline

    const statusLabel = (s: Channel['status']) =>
        s === 'connected' ? '已连接' : s === 'configuring' ? '配置中' : '离线'

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className={styles.overviewGrid}>
                        {[
                            { label: '活跃会话', value: String(channel.sessions ?? 0), icon: '💬' },
                            { label: '驱动', value: channel.driver ?? '—', icon: '⚙️' },
                            { label: '运行时间', value: channel.uptime ?? '—', icon: '⏱️' },
                            { label: '状态', value: statusLabel(channel.status), icon: '📡' },
                        ].map((item, i) => (
                            <div key={i} className={styles.overviewCard}>
                                <span className={styles.overviewIcon}>{item.icon}</span>
                                <div>
                                    <div className={styles.overviewValue}>{item.value}</div>
                                    <div className={styles.overviewLabel}>{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )

            case 'config':
                return (
                    <>
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>消息策略</div>
                            <div className={styles.configField}>
                                <div className={styles.fieldLeft}>
                                    <div className={styles.fieldLabel}>DM 策略</div>
                                    <div className={styles.fieldDesc}>控制未知发送者如何与助手交互</div>
                                </div>
                                <select className={styles.select} value={dmPolicy} onChange={e => setDmPolicy(e.target.value)}>
                                    <option value="pairing">🔒 配对 (Pairing)</option>
                                    <option value="allowlist">📋 白名单 (Allowlist)</option>
                                    <option value="open">🌐 开放 (Open)</option>
                                    <option value="disabled">🚫 禁用 (Disabled)</option>
                                </select>
                            </div>
                            <div className={styles.configField}>
                                <div className={styles.fieldLeft}>
                                    <div className={styles.fieldLabel}>媒体最大尺寸</div>
                                    <div className={styles.fieldDesc}>接收媒体文件的大小限制</div>
                                </div>
                                <select className={styles.select} value={mediaSize} onChange={e => setMediaSize(e.target.value)}>
                                    <option value="8">8 MB</option>
                                    <option value="16">16 MB</option>
                                    <option value="32">32 MB</option>
                                    <option value="64">64 MB</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>允许来源 (allowFrom)</div>
                            <div className={styles.tagsContainer}>
                                {allowFrom.map((num, i) => (
                                    <div key={i} className={styles.tag}>
                                        {num}
                                        <span className={styles.tagRemove} onClick={() => removeNumber(i)}>×</span>
                                    </div>
                                ))}
                                <input
                                    className={styles.tagInput}
                                    placeholder="输入手机号码并回车添加..."
                                    value={newNumber}
                                    onChange={e => setNewNumber(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addNumber()}
                                />
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>群组设置</div>
                            <div className={styles.configField}>
                                <div className={styles.fieldLeft}>
                                    <div className={styles.fieldLabel}>允许所有群组</div>
                                    <div className={styles.fieldDesc}>设置为 "*" 以允许所有群组</div>
                                </div>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={allowAll} onChange={e => setAllowAll(e.target.checked)} />
                                    <span className={styles.toggleSlider} />
                                </label>
                            </div>
                            <div className={styles.configField}>
                                <div className={styles.fieldLeft}>
                                    <div className={styles.fieldLabel}>需要 @提及</div>
                                    <div className={styles.fieldDesc}>在群组中需要 @提及才会响应</div>
                                </div>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={requireMention} onChange={e => setRequireMention(e.target.checked)} />
                                    <span className={styles.toggleSlider} />
                                </label>
                            </div>
                        </div>

                        {pairings.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>待审批的配对请求</div>
                                {pairings.map(p => (
                                    <div key={p.id} className={styles.pairingCard}>
                                        <div className={styles.pairingAvatar}><User size={18} /></div>
                                        <div className={styles.pairingInfo}>
                                            <div className={styles.pairingContact}>{p.contact}</div>
                                            <div className={styles.pairingCode}>配对码: {p.code}</div>
                                            <div className={styles.pairingTime}>{p.time}</div>
                                        </div>
                                        <div className={styles.pairingActions}>
                                            <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={() => approvePairing(p.id)}>
                                                <Check size={12} /> 批准
                                            </button>
                                            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => rejectPairing(p.id)}>
                                                <X size={12} /> 拒绝
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )

            case 'allowlist':
                return (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>白名单管理</div>
                        <p className={styles.hintText}>仅白名单中的联系人可以与助手交互。此设置需要 DM 策略为 "白名单" 模式才能生效。</p>
                        <div className={styles.tagsContainer}>
                            {allowFrom.map((num, i) => (
                                <div key={i} className={styles.tag}>
                                    {num}
                                    <span className={styles.tagRemove} onClick={() => removeNumber(i)}>×</span>
                                </div>
                            ))}
                            <input
                                className={styles.tagInput}
                                placeholder="输入手机号码并回车添加..."
                                value={newNumber}
                                onChange={e => setNewNumber(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addNumber()}
                            />
                        </div>
                    </div>
                )

            case 'groups':
                return (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>群组授权</div>
                        <p className={styles.hintText}>管理允许助手响应的群组列表。</p>
                        <div className={styles.configField}>
                            <div className={styles.fieldLeft}>
                                <div className={styles.fieldLabel}>允许所有群组</div>
                                <div className={styles.fieldDesc}>设置为 "*"，助手将在所有群组中响应</div>
                            </div>
                            <label className={styles.toggle}>
                                <input type="checkbox" checked={allowAll} onChange={e => setAllowAll(e.target.checked)} />
                                <span className={styles.toggleSlider} />
                            </label>
                        </div>
                        <div className={styles.configField}>
                            <div className={styles.fieldLeft}>
                                <div className={styles.fieldLabel}>需要 @提及</div>
                                <div className={styles.fieldDesc}>群组中需要 @提及助手才会响应</div>
                            </div>
                            <label className={styles.toggle}>
                                <input type="checkbox" checked={requireMention} onChange={e => setRequireMention(e.target.checked)} />
                                <span className={styles.toggleSlider} />
                            </label>
                        </div>
                    </div>
                )

            case 'logs':
                return (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>渠道日志</div>
                        <div className={styles.logBox}>
                            {[
                                { time: '12:05:43', level: 'info', msg: `${channel.name} channel connected · session active` },
                                { time: '12:04:21', level: 'info', msg: 'Message received from +86 138****7890' },
                                { time: '12:04:22', level: 'info', msg: 'Agent response generated · 1,240 tokens · 2.1s' },
                                { time: '12:03:55', level: 'debug', msg: 'Heartbeat sent · latency 45ms' },
                                { time: '12:02:10', level: 'warn', msg: 'Rate limit warning: 42/50 requests this minute' },
                                { time: '12:01:33', level: 'info', msg: 'Media received · image/jpeg · 2.3MB · processed' },
                            ].map((log, i) => (
                                <div key={i} className={styles.logLine}>
                                    <span className={styles.logTime}>{log.time}</span>
                                    <span className={`${styles.logLevel} ${styles[log.level]}`}>{log.level.toUpperCase()}</span>
                                    <span className={styles.logMsg}>{log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            default: return null
        }
    }

    return (
        <div className={styles.channels}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>渠道管理 / <span className={styles.current}>{channel.name}</span></div>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                    <Plus size={14} /> 添加渠道
                </button>
            </div>

            <div className={styles.channelLayout}>
                {/* List Panel */}
                <div className={styles.listPanel}>
                    <div className={styles.listHeader}>
                        <div className={styles.listTitle}>已配置渠道</div>
                        <div className={styles.searchBox}>
                            <Search size={14} className={styles.searchIcon} />
                            <input
                                className={styles.searchInput}
                                placeholder="搜索渠道..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.listScroll}>
                        {filtered.map(ch => (
                            <div
                                key={ch.id}
                                className={`${styles.channelItem} ${selected === ch.id ? styles.itemActive : ''}`}
                                onClick={() => setSelected(ch.id)}
                            >
                                <div className={styles.channelIcon} style={{ background: `${ch.color}18` }}>{ch.icon}</div>
                                <div className={styles.channelInfo}>
                                    <div className={styles.channelName}>{ch.name}</div>
                                    <div className={styles.channelMeta}>{ch.meta}</div>
                                </div>
                                <span className={`${styles.statusBadge} ${statusBadgeClass(ch.status)}`}>
                                    {statusLabel(ch.status)}
                                </span>
                            </div>
                        ))}
                        <button className={styles.addBtn}>＋ 添加新渠道</button>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className={styles.detailPanel} key={selected}>
                    <div className={styles.detailHeader}>
                        <div className={styles.detailIcon} style={{ background: `${channel.color}18` }}>{channel.icon}</div>
                        <div className={styles.detailTitleArea}>
                            <div className={styles.detailTitle}>{channel.name}</div>
                            <div className={styles.detailSub}>
                                {channel.driver ?? '—'} · {channel.status === 'connected' ? `设备已链接 · 已运行 ${channel.uptime}` : '未连接'}
                            </div>
                        </div>
                        <div className={`${styles.detailStatus} ${channel.status === 'connected' ? styles.statusConnected : ''}`}>
                            {channel.status === 'connected' && <div className={styles.statusDot} />}
                            {statusLabel(channel.status)}
                        </div>
                        <label className={styles.toggle}>
                            <input type="checkbox" checked={channelEnabled} onChange={e => setChannelEnabled(e.target.checked)} />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>

                    <div className={styles.detailTabs}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.detailTab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.detailContent}>
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    )
}
