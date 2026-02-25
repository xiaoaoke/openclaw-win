import { useState, useEffect, useCallback } from 'react'
import styles from './Settings.module.css'
import { Save, FolderOpen, Moon, Sun, Check, RefreshCw } from 'lucide-react'
import { useConfig, useEnvVars } from '../hooks/useConfig'
import { useGateway } from '../hooks/useGateway'

type SettingsTab = 'general' | 'gateway' | 'agent' | 'security' | 'tailscale' | 'automation' | 'browser' | 'env' | 'advanced' | 'update'

const NAV_ITEMS: { id: SettingsTab; label: string; icon: string; group?: boolean }[] = [
    { id: 'general', label: '常规', icon: '⚙️' },
    { id: 'gateway', label: 'Gateway', icon: '🌐' },
    { id: 'agent', label: 'Agent', icon: '🤖' },
    { id: 'security', label: '安全', icon: '🔒', group: true },
    { id: 'tailscale', label: 'Tailscale', icon: '🔗' },
    { id: 'automation', label: '自动化', icon: '⏰' },
    { id: 'browser', label: '浏览器', icon: '🌍', group: true },
    { id: 'env', label: '环境变量', icon: '📋' },
    { id: 'advanced', label: '高级', icon: '🔧' },
    { id: 'update', label: '更新', icon: '🔄', group: true },
]

const ACCENT_COLORS = ['#FF4500', '#448AFF', '#00E676', '#FFB300', '#E040FB', '#FF5252']

export default function Settings() {
    const { config, configPath, homePath, loading, setValue, saveConfig } = useConfig()
    const { vars: envVars, setVar: setEnvVar } = useEnvVars()
    const { status: gwStatus, restart: restartGateway } = useGateway()

    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [dirty, setDirty] = useState(false)
    const [saved, setSaved] = useState(false)

    // Local state (initialized from config, editable)
    const [workspace, setWorkspace] = useState('~/.openclaw/workspace')
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [accent, setAccent] = useState('#FF4500')
    const [language, setLanguage] = useState('zh-CN')
    const [autoStart, setAutoStart] = useState(true)
    const [autoGateway, setAutoGateway] = useState(true)
    const [trayMinimize, setTrayMinimize] = useState(true)
    const [autoUpdate, setAutoUpdate] = useState(true)
    const [gatewayPort, setGatewayPort] = useState('18789')
    const [gatewayHost, setGatewayHost] = useState('127.0.0.1')
    const [sandboxMode, setSandboxMode] = useState('standard')
    const [agentModel, setAgentModel] = useState('anthropic/claude-opus-4-6')

    // Env var editing
    const [newEnvKey, setNewEnvKey] = useState('')
    const [newEnvValue, setNewEnvValue] = useState('')

    // Sync from config on load
    useEffect(() => {
        if (!config) return
        setWorkspace(config.agents?.defaults?.workspace || '~/.openclaw/workspace')
        setGatewayPort(String(config.gateway?.port || 18789))
        setGatewayHost(config.gateway?.host || '127.0.0.1')
        setAgentModel(config.agents?.defaults?.model || 'anthropic/claude-opus-4-6')
        setSandboxMode(config.security?.sandbox || 'standard')
    }, [config])

    // Track dirty state
    const markDirty = useCallback(() => { setDirty(true); setSaved(false) }, [])

    const handleSave = async () => {
        if (!config) return
        const updated: OpenClawConfig = {
            ...config,
            agents: {
                ...config.agents,
                defaults: {
                    ...config.agents?.defaults,
                    model: agentModel,
                    workspace,
                }
            },
            gateway: {
                ...config.gateway,
                port: Number(gatewayPort),
                host: gatewayHost,
            },
            security: {
                ...config.security,
                sandbox: sandboxMode,
            }
        }
        const ok = await saveConfig(updated)
        if (ok) {
            setDirty(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    const handleAddEnvVar = async () => {
        if (newEnvKey.trim() && newEnvValue.trim()) {
            await setEnvVar(newEnvKey.trim(), newEnvValue.trim())
            setNewEnvKey('')
            setNewEnvValue('')
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <>
                        <h1 className={styles.pageTitle}>常规设置</h1>
                        <p className={styles.pageDesc}>管理应用程序的基础配置和外观</p>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>工作区</div>
                            <SettingRow label="工作区路径" desc="Agent 的工作目录，存放技能和提示文件">
                                <input className={styles.input} value={workspace} onChange={e => { setWorkspace(e.target.value); markDirty() }} />
                                <button className={styles.btn}><FolderOpen size={14} /> 浏览</button>
                            </SettingRow>
                            <SettingRow label="配置文件位置" desc="OpenClaw 主配置文件路径">
                                <input className={styles.input} value={configPath || '~/.openclaw/openclaw.json'} readOnly style={{ opacity: 0.6 }} />
                                <button className={styles.btn} onClick={() => {
                                    if (window.electronAPI?.openPath && configPath) window.electronAPI.openPath(configPath)
                                }}><FolderOpen size={14} /> 打开</button>
                            </SettingRow>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>外观</div>
                            <SettingRow label="主题模式" desc="选择应用的视觉主题">
                                <div className={styles.themeToggle}>
                                    <button className={`${styles.themeOption} ${theme === 'dark' ? styles.themeActive : ''}`} onClick={() => { setTheme('dark'); markDirty() }}>
                                        <Moon size={14} /> 深色
                                    </button>
                                    <button className={`${styles.themeOption} ${theme === 'light' ? styles.themeActive : ''}`} onClick={() => { setTheme('light'); markDirty() }}>
                                        <Sun size={14} /> 浅色
                                    </button>
                                </div>
                            </SettingRow>
                            <SettingRow label="强调色" desc="应用的主要品牌色">
                                <div className={styles.colorPicker}>
                                    {ACCENT_COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`${styles.colorSwatch} ${accent === c ? styles.swatchActive : ''}`}
                                            style={{ background: c }}
                                            onClick={() => { setAccent(c); markDirty() }}
                                        />
                                    ))}
                                </div>
                            </SettingRow>
                            <SettingRow label="语言" desc="应用界面语言">
                                <select className={styles.select} value={language} onChange={e => { setLanguage(e.target.value); markDirty() }}>
                                    <option value="zh-CN">简体中文</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                </select>
                            </SettingRow>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>启动行为</div>
                            <ToggleRow label="开机自启动" desc="系统启动时自动运行 OpenClaw Desktop" checked={autoStart} onChange={v => { setAutoStart(v); markDirty() }} />
                            <ToggleRow label="自动启动 Gateway" desc="应用启动时自动运行 Gateway 守护进程" checked={autoGateway} onChange={v => { setAutoGateway(v); markDirty() }} />
                            <ToggleRow label="最小化到系统托盘" desc="关闭窗口时最小化到托盘而非退出" checked={trayMinimize} onChange={v => { setTrayMinimize(v); markDirty() }} />
                            <ToggleRow label="启动时检查更新" desc="自动检测 OpenClaw 和应用的新版本" checked={autoUpdate} onChange={v => { setAutoUpdate(v); markDirty() }} />
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>数据管理</div>
                            <SettingRow label="OpenClaw Home" desc="配置、日志和数据存储根目录">
                                <code className={styles.codeBadge}>{homePath || '~/.openclaw'}</code>
                                <button className={styles.btn} onClick={() => {
                                    if (window.electronAPI?.openPath && homePath) window.electronAPI.openPath(homePath)
                                }}><FolderOpen size={14} /> 打开</button>
                            </SettingRow>
                            <SettingRow label="导入/导出配置" desc="备份或恢复您的完整 OpenClaw 配置">
                                <button className={styles.btn}>📤 导出</button>
                                <button className={styles.btn}>📥 导入</button>
                                <button className={`${styles.btn} ${styles.btnDanger}`}>🔄 重置</button>
                            </SettingRow>
                        </div>
                    </>
                )

            case 'gateway':
                return (
                    <>
                        <h1 className={styles.pageTitle}>Gateway 设置</h1>
                        <p className={styles.pageDesc}>配置 OpenClaw Gateway 的网络和连接参数</p>

                        <div className={styles.gatewayStatusCard}>
                            <div className={styles.gsLeft}>
                                <div className={`${styles.gsDot} ${gwStatus.status === 'running' ? styles.gsActive : ''}`} />
                                <div>
                                    <div className={styles.gsTitle}>Gateway {gwStatus.status === 'running' ? '运行中' : '已停止'}</div>
                                    <div className={styles.gsMeta}>ws://{gatewayHost}:{gatewayPort} {gwStatus.pid ? `· PID ${gwStatus.pid}` : ''}</div>
                                </div>
                            </div>
                            <button className={styles.btnSmall} onClick={() => restartGateway()}>
                                <RefreshCw size={12} /> 重启
                            </button>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>网络</div>
                            <SettingRow label="监听地址" desc="Gateway WebSocket 服务器监听的地址">
                                <input className={styles.input} value={gatewayHost} onChange={e => { setGatewayHost(e.target.value); markDirty() }} />
                            </SettingRow>
                            <SettingRow label="端口" desc="Gateway WebSocket 端口号">
                                <input className={styles.input} value={gatewayPort} onChange={e => { setGatewayPort(e.target.value); markDirty() }} />
                            </SettingRow>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>高级</div>
                            <ToggleRow label="热重载配置" desc="配置文件修改后自动重新加载，无需重启" checked={true} onChange={() => { }} />
                            <ToggleRow label="启用 RPC" desc="允许通过 WebSocket 远程调用 Gateway 功能" checked={true} onChange={() => { }} />
                        </div>
                    </>
                )

            case 'agent':
                return (
                    <>
                        <h1 className={styles.pageTitle}>Agent 设置</h1>
                        <p className={styles.pageDesc}>配置 AI Agent 的默认行为和参数</p>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>默认模型</div>
                            <SettingRow label="默认 AI 模型" desc="新会话默认使用的模型">
                                <select className={styles.select} value={agentModel} onChange={e => { setAgentModel(e.target.value); markDirty() }}>
                                    <option value="anthropic/claude-opus-4-6">Claude Opus 4.6</option>
                                    <option value="openai/gpt-5.2">GPT-5.2</option>
                                    <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                                    <option value="deepseek/v4">DeepSeek V4</option>
                                </select>
                            </SettingRow>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>行为</div>
                            <ToggleRow label="流式响应" desc="以打字机效果逐步显示 AI 回复" checked={true} onChange={() => { }} />
                            <ToggleRow label="自动命名会话" desc="根据对话内容自动生成会话标题" checked={true} onChange={() => { }} />
                            <ToggleRow label="工具调用确认" desc="Agent 使用工具前需要用户确认" checked={false} onChange={() => { }} />
                        </div>
                    </>
                )

            case 'security':
                return (
                    <>
                        <h1 className={styles.pageTitle}>安全设置</h1>
                        <p className={styles.pageDesc}>管理 Agent 的沙箱和安全策略</p>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>沙箱</div>
                            <SettingRow label="沙箱模式" desc="控制 Agent 的系统访问权限级别">
                                <select className={styles.select} value={sandboxMode} onChange={e => { setSandboxMode(e.target.value); markDirty() }}>
                                    <option value="strict">🔒 严格 (严格隔离)</option>
                                    <option value="standard">⚡ 标准 (推荐)</option>
                                    <option value="relaxed">⚠️ 宽松 (完全访问)</option>
                                </select>
                            </SettingRow>
                            <ToggleRow label="限制文件系统访问" desc="Agent 只能访问工作区内的文件" checked={true} onChange={() => { }} />
                            <ToggleRow label="限制网络访问" desc="Agent 只能访问白名单内的域名" checked={false} onChange={() => { }} />
                        </div>
                    </>
                )

            case 'env':
                return (
                    <>
                        <h1 className={styles.pageTitle}>环境变量</h1>
                        <p className={styles.pageDesc}>管理 OpenClaw 的环境变量和 API 密钥</p>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>当前变量</div>
                            {Object.keys(envVars).length === 0 ? (
                                <div className={styles.emptyState}>尚无环境变量配置</div>
                            ) : (
                                Object.entries(envVars).map(([key, value]) => (
                                    <div key={key} className={styles.envRow}>
                                        <code className={styles.envKey}>{key}</code>
                                        <code className={styles.envValue}>{key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? '••••••••' : value}</code>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>添加变量</div>
                            <div className={styles.addEnvRow}>
                                <input className={styles.input} placeholder="变量名 (如 OPENAI_API_KEY)" value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} />
                                <input className={styles.input} placeholder="值" value={newEnvValue} onChange={e => setNewEnvValue(e.target.value)} />
                                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddEnvVar} disabled={!newEnvKey.trim()}>
                                    添加
                                </button>
                            </div>
                            <div className={styles.envHint}>💡 敏感信息（如 API 密钥）仅存储在本地 ~/.openclaw/.env 中</div>
                        </div>
                    </>
                )

            default:
                return (
                    <>
                        <h1 className={styles.pageTitle}>{NAV_ITEMS.find(n => n.id === activeTab)?.label} 设置</h1>
                        <p className={styles.pageDesc}>此页面正在开发中...</p>
                        <div className={styles.comingSoon}>
                            <span>🚧</span>
                            <p>即将推出</p>
                        </div>
                    </>
                )
        }
    }

    return (
        <div className={styles.settings}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>设置 / <span className={styles.current}>{NAV_ITEMS.find(n => n.id === activeTab)?.label}</span></div>
                <button className={`${styles.btn} ${dirty ? styles.btnPrimary : saved ? styles.btnSuccess : styles.btnDisabled}`} onClick={handleSave} disabled={!dirty && !loading}>
                    {saved ? <><Check size={14} /> 已保存</> : <><Save size={14} /> 保存更改</>}
                </button>
            </div>

            <div className={styles.layout}>
                <div className={styles.nav}>
                    {NAV_ITEMS.map((item, i) => (
                        <div key={item.id}>
                            {item.group && i > 0 && <div className={styles.navDivider} />}
                            <button
                                className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ''}`}
                                onClick={() => setActiveTab(item.id)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span> {item.label}
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

/* Helper Components */
function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
    return (
        <div className={styles.settingRow}>
            <div className={styles.settingLeft}>
                <div className={styles.settingLabel}>{label}</div>
                <div className={styles.settingDesc}>{desc}</div>
            </div>
            <div className={styles.settingRight}>{children}</div>
        </div>
    )
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className={styles.settingRow}>
            <div className={styles.settingLeft}>
                <div className={styles.settingLabel}>{label}</div>
                <div className={styles.settingDesc}>{desc}</div>
            </div>
            <div className={styles.settingRight}>
                <label className={styles.toggle}>
                    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
                    <span className={styles.toggleSlider} />
                </label>
            </div>
        </div>
    )
}
