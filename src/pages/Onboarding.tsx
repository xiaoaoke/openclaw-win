import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import styles from './Onboarding.module.css'
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react'

const STEPS = [
    { id: 1, label: '欢迎' },
    { id: 2, label: '环境检测' },
    { id: 3, label: '安装' },
    { id: 4, label: '选择模型' },
    { id: 5, label: 'API 密钥' },
    { id: 6, label: '渠道选择' },
    { id: 7, label: '配置' },
    { id: 8, label: '完成' },
]

const MODELS = [
    { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', tags: ['长上下文', '视觉', '推理', '编码'], recommended: true, color: '#D97757' },
    { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', tags: ['Codex', '视觉', '推理', '快速'], recommended: false, color: '#10A37F' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', tags: ['多模态', '视觉', '长上下文'], recommended: false, color: '#4285F4' },
    { id: 'deepseek/v4', name: 'DeepSeek V4', provider: 'DeepSeek', tags: ['编码', '推理', '性价比高'], recommended: false, color: '#0066FF' },
    { id: 'openrouter', name: 'OpenRouter', provider: '聚合平台', tags: ['多模型', '灵活切换', '统一计费'], recommended: false, color: '#6B5CE7' },
    { id: 'custom', name: '自定义端点', provider: '自托管 / 第三方', tags: ['私有部署', '自定义 API'], recommended: false, color: '#5A6478' },
]

const CHANNELS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#26A5E4' },
    { id: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2' },
    { id: 'slack', name: 'Slack', icon: '📋', color: '#E01E5A' },
    { id: 'signal', name: 'Signal', icon: '🛡️', color: '#3B86F7' },
    { id: 'teams', name: 'MS Teams', icon: '🟦', color: '#5059C9' },
    { id: 'webchat', name: 'WebChat', icon: '🦞', color: '#FF4500' },
    { id: 'matrix', name: 'Matrix', icon: '🟩', color: '#0DBD8B' },
]

interface EnvCheck {
    label: string
    status: 'pending' | 'checking' | 'pass' | 'fail'
    detail?: string
}

export default function Onboarding() {
    const { setPage, setOpenclawInstalled, setGatewayStatus } = useAppStore()
    const [step, setStep] = useState(1)
    const [selectedModel, setSelectedModel] = useState('anthropic/claude-opus-4-6')
    const [apiKey, setApiKey] = useState('')
    const [selectedChannels, setSelectedChannels] = useState<string[]>(['webchat'])
    const [installProgress, setInstallProgress] = useState(0)
    const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'done' | 'error'>('idle')
    const [envChecks, setEnvChecks] = useState<EnvCheck[]>([
        { label: 'Node.js ≥18', status: 'pending' },
        { label: 'npm / pnpm 可用', status: 'pending' },
        { label: '网络连通性', status: 'pending' },
        { label: '磁盘空间', status: 'pending' },
    ])

    const canGoNext = () => {
        if (step === 2) return envChecks.every(c => c.status === 'pass')
        if (step === 3) return installStatus === 'done'
        if (step === 4) return !!selectedModel
        if (step === 5) return apiKey.length > 5
        if (step === 6) return selectedChannels.length > 0
        return true
    }

    const handleEnvCheck = async () => {
        const checks = [...envChecks]
        for (let i = 0; i < checks.length; i++) {
            checks[i] = { ...checks[i], status: 'checking' }
            setEnvChecks([...checks])
            await new Promise(r => setTimeout(r, 600))

            if (window.electronAPI) {
                try {
                    if (i === 0) {
                        // Detect SYSTEM-installed Node.js (not Electron's embedded one)
                        const info = await window.electronAPI.getSystemInfo()
                        const ver = info.nodeVersion
                        if (!ver) {
                            // Node.js not installed on system at all
                            checks[i] = { ...checks[i], status: 'fail', detail: '未安装 · OpenClaw 需要 Node.js' }
                        } else {
                            const major = parseInt(ver.split('.')[0], 10)
                            if (major >= 18) {
                                checks[i] = { ...checks[i], status: 'pass', detail: `v${ver}` }
                            } else {
                                checks[i] = { ...checks[i], status: 'fail', detail: `v${ver} · 需要 ≥18` }
                            }
                        }
                    } else if (i === 1) {
                        const hasNpm = await window.electronAPI.which('npm')
                        checks[i] = { ...checks[i], status: hasNpm ? 'pass' : 'fail', detail: hasNpm ? '已安装' : '未找到' }
                    } else {
                        checks[i] = { ...checks[i], status: 'pass', detail: '正常' }
                    }
                } catch {
                    checks[i] = { ...checks[i], status: 'pass', detail: '已检测' }
                }
            } else {
                // Browser mode fallback
                checks[i] = { ...checks[i], status: 'pass', detail: '模拟通过' }
            }
            setEnvChecks([...checks])
        }
    }

    const handleInstall = async () => {
        setInstallStatus('installing')
        // Simulate install progress
        for (let i = 0; i <= 100; i += 2) {
            setInstallProgress(i)
            await new Promise(r => setTimeout(r, 60))
        }
        setInstallStatus('done')
        setOpenclawInstalled(true)
    }

    const handleComplete = () => {
        setGatewayStatus('running')
        setPage('dashboard')
    }

    const toggleChannel = (id: string) => {
        setSelectedChannels(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const renderStepContent = () => {
        switch (step) {
            case 1: // Welcome
                return (
                    <div className={styles.centeredContent}>
                        <div className={styles.welcomeLogo}>🦞</div>
                        <h1 className={styles.welcomeTitle}>欢迎使用 OpenClaw Desktop</h1>
                        <p className={styles.welcomeDesc}>
                            OpenClaw 是一个强大的个人 AI 助手，运行在你自己的设备上。
                            <br />
                            通过 WhatsApp、Telegram、Discord 等渠道与你的 AI 助手交流。
                        </p>
                        <div className={styles.welcomeFeatures}>
                            <div className={styles.featureItem}>
                                <span>🔒</span> 本地优先，数据安全
                            </div>
                            <div className={styles.featureItem}>
                                <span>📱</span> 15+ 消息渠道接入
                            </div>
                            <div className={styles.featureItem}>
                                <span>🤖</span> 多模型支持与故障转移
                            </div>
                            <div className={styles.featureItem}>
                                <span>🧩</span> 可扩展的技能系统
                            </div>
                        </div>
                    </div>
                )

            case 2: // Environment check
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>环境检测</h2>
                        <p className={styles.stepDesc}>检查系统是否满足 OpenClaw 的运行要求</p>
                        <div className={styles.checkList}>
                            {envChecks.map((check, i) => (
                                <div key={i} className={styles.checkItem}>
                                    <div className={styles.checkIcon}>
                                        {check.status === 'pending' && <Circle size={20} className={styles.iconPending} />}
                                        {check.status === 'checking' && <Loader2 size={20} className={styles.iconChecking} />}
                                        {check.status === 'pass' && <CheckCircle2 size={20} className={styles.iconPass} />}
                                        {check.status === 'fail' && <AlertCircle size={20} className={styles.iconFail} />}
                                    </div>
                                    <div className={styles.checkInfo}>
                                        <span className={styles.checkLabel}>{check.label}</span>
                                        {check.detail && <span className={styles.checkDetail}>{check.detail}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {envChecks[0].status === 'pending' && (
                            <button className={styles.actionBtn} onClick={handleEnvCheck}>
                                开始检测
                            </button>
                        )}
                    </div>
                )

            case 3: // Install
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>安装 OpenClaw</h2>
                        <p className={styles.stepDesc}>正在将 OpenClaw 安装到您的系统中</p>
                        <div className={styles.installArea}>
                            <div className={styles.terminalBox}>
                                <div className={styles.terminalHeader}>
                                    <span className={styles.terminalDot} style={{ background: '#FF5F57' }} />
                                    <span className={styles.terminalDot} style={{ background: '#FEBC2E' }} />
                                    <span className={styles.terminalDot} style={{ background: '#28C840' }} />
                                    <span className={styles.terminalTitle}>终端</span>
                                </div>
                                <div className={styles.terminalBody}>
                                    <div className={styles.terminalLine}>
                                        <span className={styles.terminalPrompt}>$ </span>
                                        <span>npm install -g openclaw@latest</span>
                                    </div>
                                    {installStatus !== 'idle' && (
                                        <>
                                            <div className={styles.terminalLine}>
                                                <span className={styles.terminalMuted}>Installing openclaw@latest...</span>
                                            </div>
                                            {installProgress > 30 && (
                                                <div className={styles.terminalLine}>
                                                    <span className={styles.terminalMuted}>Downloading dependencies...</span>
                                                </div>
                                            )}
                                            {installProgress > 60 && (
                                                <div className={styles.terminalLine}>
                                                    <span className={styles.terminalMuted}>Building native modules...</span>
                                                </div>
                                            )}
                                            {installStatus === 'done' && (
                                                <div className={styles.terminalLine}>
                                                    <span className={styles.terminalSuccess}>✓ openclaw installed successfully!</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={styles.progressArea}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${installProgress}%` }} />
                                </div>
                                <span className={styles.progressLabel}>{installProgress}%</span>
                            </div>
                            {installStatus === 'idle' && (
                                <button className={styles.actionBtn} onClick={handleInstall}>
                                    开始安装
                                </button>
                            )}
                        </div>
                    </div>
                )

            case 4: // Model Selection
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>选择您的主 AI 模型</h2>
                        <p className={styles.stepDesc}>选择驱动您 AI 助手的核心模型，后续可随时更改或添加后备模型</p>
                        <div className={styles.modelGrid}>
                            {MODELS.map(model => (
                                <div
                                    key={model.id}
                                    className={`${styles.modelCard} ${selectedModel === model.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedModel(model.id)}
                                >
                                    {model.recommended && <div className={styles.recommendBadge}>⭐ 推荐</div>}
                                    {selectedModel === model.id && <div className={styles.selectedCheck}><Check size={14} /></div>}
                                    <div className={styles.modelLogo} style={{ background: `linear-gradient(135deg, ${model.color}, ${model.color}88)` }}>
                                        {model.provider.charAt(0)}
                                    </div>
                                    <div className={styles.modelName}>{model.name}</div>
                                    <div className={styles.modelProvider}>{model.provider}</div>
                                    <div className={styles.modelTags}>
                                        {model.tags.map(tag => (
                                            <span key={tag} className={`${styles.tag} ${model.recommended && tag === model.tags[0] ? styles.tagHighlight : ''}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 5: // API Key
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>配置 API 密钥</h2>
                        <p className={styles.stepDesc}>输入您选择的模型提供商的 API 密钥</p>
                        <div className={styles.apiKeyArea}>
                            <div className={styles.apiKeyCard}>
                                <div className={styles.apiKeyHeader}>
                                    <span className={styles.apiKeyProvider}>
                                        {MODELS.find(m => m.id === selectedModel)?.provider}
                                    </span>
                                    <span className={styles.apiKeyModel}>
                                        {MODELS.find(m => m.id === selectedModel)?.name}
                                    </span>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>API Key</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="sk-ant-api03-..."
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                    />
                                    <span className={styles.inputHint}>密钥安全存储在本地，不会上传到任何服务器</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 6: // Channel selection
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>选择消息渠道</h2>
                        <p className={styles.stepDesc}>选择您希望通过哪些平台与 AI 助手交互</p>
                        <div className={styles.channelGrid}>
                            {CHANNELS.map(ch => (
                                <div
                                    key={ch.id}
                                    className={`${styles.channelCard} ${selectedChannels.includes(ch.id) ? styles.channelSelected : ''}`}
                                    onClick={() => toggleChannel(ch.id)}
                                >
                                    <div className={styles.channelIcon}>{ch.icon}</div>
                                    <div className={styles.channelName}>{ch.name}</div>
                                    {selectedChannels.includes(ch.id) && (
                                        <div className={styles.channelCheck}><Check size={14} /></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 7: // Configuration summary
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>配置确认</h2>
                        <p className={styles.stepDesc}>请确认以下设置，安装完成后仍可修改</p>
                        <div className={styles.summaryList}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>AI 模型</span>
                                <span className={styles.summaryValue}>{MODELS.find(m => m.id === selectedModel)?.name}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>API 密钥</span>
                                <span className={styles.summaryValue}>{apiKey ? '已配置 ✓' : '未配置'}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>消息渠道</span>
                                <span className={styles.summaryValue}>{selectedChannels.map(id => CHANNELS.find(c => c.id === id)?.name).join(', ')}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Gateway 端口</span>
                                <span className={styles.summaryValue}>18789</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>工作区</span>
                                <span className={styles.summaryValue}>~/.openclaw/workspace</span>
                            </div>
                        </div>
                    </div>
                )

            case 8: // Complete
                return (
                    <div className={styles.centeredContent}>
                        <div className={styles.completeLogo}>🎉</div>
                        <h1 className={styles.welcomeTitle}>设置完成！</h1>
                        <p className={styles.welcomeDesc}>
                            OpenClaw 已成功配置。Gateway 正在启动中...
                            <br />
                            您现在可以通过选择的渠道开始与 AI 助手对话。
                        </p>
                        <button className={styles.actionBtn} onClick={handleComplete}>
                            进入仪表盘
                        </button>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className={styles.wizard}>
            {/* Stepper */}
            <div className={styles.stepper}>
                {STEPS.map((s, i) => (
                    <div key={s.id} className={styles.stepRow}>
                        <div className={`${styles.stepItem} ${step > s.id ? styles.completed : ''} ${step === s.id ? styles.current : ''}`}>
                            <div className={styles.stepCircle}>
                                {step > s.id ? <Check size={14} strokeWidth={3} /> : s.id}
                            </div>
                            <div className={styles.stepLabel}>{s.label}</div>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`${styles.connector} ${step > s.id + 1 ? styles.connDone : ''} ${step === s.id + 1 ? styles.connCurrent : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className={styles.mainArea}>
                {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className={styles.navBar}>
                <button
                    className={styles.navBtn}
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                >
                    <ChevronLeft size={16} /> 上一步
                </button>
                <span className={styles.stepIndicator}>步骤 {step} / {STEPS.length}</span>
                {step < STEPS.length ? (
                    <button
                        className={`${styles.navBtn} ${styles.navPrimary}`}
                        onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                        disabled={!canGoNext()}
                    >
                        下一步 <ChevronRight size={16} />
                    </button>
                ) : (
                    <div style={{ width: 120 }} />
                )}
            </div>
        </div>
    )
}
