import { useState } from 'react'
import styles from './Models.module.css'
import { Eye, EyeOff, GripVertical, Trash2, Plus, Zap, Shield, ArrowUpDown } from 'lucide-react'

interface ModelConfig {
    id: string; name: string; provider: string; color: string
    apiKeySet: boolean; maxTokens: number; temperature: number; isDefault: boolean
}

const MODELS: ModelConfig[] = [
    { id: 'claude-opus', name: 'Claude Opus 4.6', provider: 'Anthropic', color: '#D97757', apiKeySet: true, maxTokens: 200000, temperature: 0.7, isDefault: true },
    { id: 'gpt-5', name: 'GPT-5.2', provider: 'OpenAI', color: '#10A37F', apiKeySet: true, maxTokens: 128000, temperature: 0.7, isDefault: false },
    { id: 'gemini', name: 'Gemini 2.5 Pro', provider: 'Google', color: '#4285F4', apiKeySet: false, maxTokens: 2000000, temperature: 0.5, isDefault: false },
    { id: 'deepseek', name: 'DeepSeek V4', provider: 'DeepSeek', color: '#0066FF', apiKeySet: true, maxTokens: 128000, temperature: 0.6, isDefault: false },
]

export default function Models() {
    const [models, setModels] = useState(MODELS)
    const [selectedId, setSelectedId] = useState('claude-opus')
    const [showKey, setShowKey] = useState(false)
    const [apiKey, setApiKey] = useState('sk-ant-api03-••••••••••••••••')
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(200000)

    const selected = models.find(m => m.id === selectedId)!

    const setDefault = (id: string) => {
        setModels(models.map(m => ({ ...m, isDefault: m.id === id })))
    }

    return (
        <div className={styles.models}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>模型管理 / <span className={styles.current}>{selected.name}</span></div>
                <button className={`${styles.btn} ${styles.btnPrimary}`}><Plus size={14} /> 添加模型</button>
            </div>

            <div className={styles.layout}>
                {/* Model List */}
                <div className={styles.listPanel}>
                    <div className={styles.listTitle}>已配置模型</div>

                    <div className={styles.modelList}>
                        {models.map(m => (
                            <div
                                key={m.id}
                                className={`${styles.modelItem} ${selectedId === m.id ? styles.itemActive : ''}`}
                                onClick={() => { setSelectedId(m.id); setTemperature(m.temperature); setMaxTokens(m.maxTokens) }}
                            >
                                <div className={styles.modelLogo} style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}88)` }}>
                                    {m.provider.charAt(0)}
                                </div>
                                <div className={styles.modelInfo}>
                                    <div className={styles.modelName}>
                                        {m.name}
                                        {m.isDefault && <span className={styles.defaultBadge}>默认</span>}
                                    </div>
                                    <div className={styles.modelMeta}>{m.provider}</div>
                                </div>
                                <div className={`${styles.keyStatus} ${m.apiKeySet ? styles.keySet : styles.keyMissing}`}>
                                    {m.apiKeySet ? '✓ 密钥' : '⚠ 无密钥'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Failover Chain */}
                    <div className={styles.failoverSection}>
                        <div className={styles.failoverTitle}>
                            <ArrowUpDown size={14} /> 故障转移链
                        </div>
                        <p className={styles.failoverDesc}>当主模型不可用时，按顺序自动切换</p>
                        <div className={styles.failoverChain}>
                            {models.filter(m => m.apiKeySet).map((m, i) => (
                                <div key={m.id} className={styles.failoverItem}>
                                    <GripVertical size={14} className={styles.failoverGrip} />
                                    <span className={styles.failoverOrder}>{i + 1}</span>
                                    <div className={styles.failoverDot} style={{ background: m.color }} />
                                    <span className={styles.failoverName}>{m.name}</span>
                                    {m.isDefault && <span className={styles.failoverPrimary}>主要</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className={styles.detailPanel} key={selectedId}>
                    {/* Model Header */}
                    <div className={styles.detailHeader}>
                        <div className={styles.headerLogo} style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}88)` }}>
                            {selected.provider.charAt(0)}
                        </div>
                        <div className={styles.headerInfo}>
                            <h2 className={styles.headerTitle}>{selected.name}</h2>
                            <span className={styles.headerProvider}>{selected.provider}</span>
                        </div>
                        {!selected.isDefault && (
                            <button className={styles.btn} onClick={() => setDefault(selectedId)}>
                                <Zap size={14} /> 设为默认
                            </button>
                        )}
                        {selected.isDefault && (
                            <div className={styles.defaultLabel}><Zap size={14} /> 当前默认模型</div>
                        )}
                    </div>

                    <div className={styles.detailScroll}>
                        {/* API Key */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}><Shield size={14} /> API 密钥</div>
                            <div className={styles.apiKeyRow}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    className={styles.apiInput}
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="输入 API 密钥..."
                                />
                                <button className={styles.iconBtn} onClick={() => setShowKey(!showKey)}>
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className={styles.hint}>密钥安全存储在本地，不会上传到任何服务器</div>
                        </div>

                        {/* Parameters */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>模型参数</div>
                            <div className={styles.paramField}>
                                <div className={styles.paramHeader}>
                                    <span className={styles.paramLabel}>Temperature</span>
                                    <span className={styles.paramValue}>{temperature.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="2" step="0.1"
                                    className={styles.slider}
                                    value={temperature}
                                    onChange={e => setTemperature(parseFloat(e.target.value))}
                                />
                                <div className={styles.paramRange}>
                                    <span>精确</span><span>创造性</span>
                                </div>
                            </div>

                            <div className={styles.paramField}>
                                <div className={styles.paramHeader}>
                                    <span className={styles.paramLabel}>最大 Tokens</span>
                                    <span className={styles.paramValue}>{maxTokens.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range" min="1000" max={selected.maxTokens} step="1000"
                                    className={styles.slider}
                                    value={maxTokens}
                                    onChange={e => setMaxTokens(parseInt(e.target.value))}
                                />
                                <div className={styles.paramRange}>
                                    <span>1K</span><span>{(selected.maxTokens / 1000).toFixed(0)}K</span>
                                </div>
                            </div>
                        </div>

                        {/* Capabilities */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>模型能力</div>
                            <div className={styles.capGrid}>
                                {[
                                    { icon: '💬', label: '文本对话', supported: true },
                                    { icon: '👁', label: '视觉理解', supported: true },
                                    { icon: '🧠', label: '深度推理', supported: true },
                                    { icon: '💻', label: '代码生成', supported: true },
                                    { icon: '🔧', label: '工具调用', supported: true },
                                    { icon: '📊', label: '数据分析', supported: true },
                                    { icon: '🎨', label: '图像生成', supported: false },
                                    { icon: '🎵', label: '音频处理', supported: false },
                                ].map((cap, i) => (
                                    <div key={i} className={`${styles.capItem} ${cap.supported ? styles.capSupported : styles.capUnsupported}`}>
                                        <span className={styles.capIcon}>{cap.icon}</span>
                                        <span className={styles.capLabel}>{cap.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className={styles.section}>
                            <div className={`${styles.sectionTitle} ${styles.dangerTitle}`}>危险操作</div>
                            <div className={styles.dangerZone}>
                                <div className={styles.dangerInfo}>
                                    <div className={styles.dangerLabel}>移除此模型</div>
                                    <div className={styles.dangerDesc}>从配置中删除此模型及其 API 密钥</div>
                                </div>
                                <button className={`${styles.btn} ${styles.btnDanger}`}>
                                    <Trash2 size={14} /> 移除模型
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
