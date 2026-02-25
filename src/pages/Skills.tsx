import { useState } from 'react'
import styles from './Skills.module.css'
import { Search, Download, Check, Star, Filter, Grid3X3, List, ExternalLink, Tag } from 'lucide-react'

type SkillCategory = 'all' | 'tools' | 'automation' | 'data' | 'creative' | 'dev' | 'system'

interface Skill {
    id: string; name: string; desc: string; icon: string
    author: string; version: string; category: SkillCategory
    downloads: number; rating: number; installed: boolean
    tags: string[]; color: string; featured?: boolean
}

const SKILLS: Skill[] = [
    { id: 'browser', name: '浏览器', desc: '让 AI 助手浏览网页、提取内容并自动化 Web 操作', icon: '🌐', author: 'OpenClaw', version: '2.4.0', category: 'tools', downloads: 28400, rating: 4.9, installed: true, tags: ['搜索', 'Web', '截图'], color: '#448AFF', featured: true },
    { id: 'canvas', name: 'Canvas', desc: '生成 SVG 和 HTML 可视化内容，创建图表和图形', icon: '🎨', author: 'OpenClaw', version: '1.8.2', category: 'creative', downloads: 15200, rating: 4.7, installed: true, tags: ['SVG', '图表', '可视化'], color: '#E040FB' },
    { id: 'cron', name: '定时任务', desc: '计划和管理定时自动化任务，支持 Cron 表达式', icon: '⏰', author: 'OpenClaw', version: '1.5.0', category: 'automation', downloads: 9800, rating: 4.6, installed: true, tags: ['定时', '自动化', '调度'], color: '#FFB300' },
    { id: 'nodes', name: 'Nodes', desc: '跨设备工作流编排，远程代码执行与文件传输', icon: '🔗', author: 'OpenClaw', version: '2.0.1', category: 'system', downloads: 7600, rating: 4.5, installed: false, tags: ['分布式', '远程', '编排'], color: '#26A5E4' },
    { id: 'code-exec', name: '代码执行', desc: '安全沙箱中执行 Python/JS/Shell 代码片段', icon: '💻', author: 'OpenClaw', version: '3.1.0', category: 'dev', downloads: 22100, rating: 4.8, installed: true, tags: ['Python', 'JS', '沙箱'], color: '#00E676', featured: true },
    { id: 'file-manager', name: '文件管理', desc: '浏览、搜索、转换和管理本地及云端文件', icon: '📁', author: 'OpenClaw', version: '1.3.4', category: 'tools', downloads: 11300, rating: 4.4, installed: false, tags: ['文件', '搜索', '转换'], color: '#FF7043' },
    { id: 'sql-query', name: 'SQL 查询', desc: '连接数据库并执行 SQL 查询、分析数据', icon: '🗄️', author: 'Community', version: '1.2.0', category: 'data', downloads: 6800, rating: 4.3, installed: false, tags: ['SQL', '数据库', '分析'], color: '#5C6BC0' },
    { id: 'image-gen', name: '图像生成', desc: '集成 DALL-E、Stable Diffusion 等模型生成图像', icon: '🖼️', author: 'Community', version: '2.0.3', category: 'creative', downloads: 18500, rating: 4.6, installed: false, tags: ['AI 图像', 'DALL-E', 'SD'], color: '#AB47BC' },
    { id: 'git-ops', name: 'Git 操作', desc: '执行 Git 版本控制操作，管理代码仓库', icon: '🔀', author: 'Community', version: '1.7.1', category: 'dev', downloads: 14200, rating: 4.5, installed: false, tags: ['Git', '版本控制', '代码'], color: '#EF5350' },
    { id: 'web-scraper', name: '网页采集', desc: '结构化抓取网页数据，支持 CSS 选择器和 XPath', icon: '🕷️', author: 'Community', version: '1.4.2', category: 'data', downloads: 8900, rating: 4.2, installed: false, tags: ['爬虫', '提取', '数据'], color: '#78909C' },
    { id: 'email', name: '邮件', desc: '发送、读取和管理邮件，支持 SMTP/IMAP', icon: '📧', author: 'Community', version: '1.1.0', category: 'automation', downloads: 5400, rating: 4.1, installed: false, tags: ['邮件', 'SMTP', '通知'], color: '#42A5F5' },
    { id: 'api-client', name: 'API 客户端', desc: '构建和执行 REST/GraphQL API 请求', icon: '🔌', author: 'Community', version: '2.2.0', category: 'dev', downloads: 13700, rating: 4.7, installed: false, tags: ['REST', 'GraphQL', 'HTTP'], color: '#66BB6A' },
]

const CATEGORIES: { id: SkillCategory; label: string; icon: string }[] = [
    { id: 'all', label: '全部', icon: '📦' },
    { id: 'tools', label: '工具', icon: '🔧' },
    { id: 'automation', label: '自动化', icon: '⚡' },
    { id: 'data', label: '数据', icon: '📊' },
    { id: 'creative', label: '创作', icon: '🎨' },
    { id: 'dev', label: '开发', icon: '💻' },
    { id: 'system', label: '系统', icon: '⚙️' },
]

export default function Skills() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<SkillCategory>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [skills, setSkills] = useState(SKILLS)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const filtered = skills.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.includes(search)
        const matchCat = category === 'all' || s.category === category
        return matchSearch && matchCat
    })

    const selected = selectedId ? skills.find(s => s.id === selectedId) : null

    const toggleInstall = (id: string) => {
        setSkills(skills.map(s => s.id === id ? { ...s, installed: !s.installed } : s))
    }

    const formatDownloads = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>技能市场 / <span className={styles.current}>{category === 'all' ? '全部' : CATEGORIES.find(c => c.id === category)?.label}</span></div>
                <div className={styles.headerRight}>
                    <span className={styles.statText}>已安装: {skills.filter(s => s.installed).length} / {skills.length}</span>
                </div>
            </div>

            <div className={styles.layout}>
                {/* Sidebar Filters */}
                <div className={styles.filterPanel}>
                    <div className={styles.filterTitle}>分类</div>
                    {CATEGORIES.map(c => (
                        <button
                            key={c.id}
                            className={`${styles.catItem} ${category === c.id ? styles.catActive : ''}`}
                            onClick={() => setCategory(c.id)}
                        >
                            <span>{c.icon}</span> {c.label}
                            <span className={styles.catCount}>
                                {c.id === 'all' ? skills.length : skills.filter(s => s.category === c.id).length}
                            </span>
                        </button>
                    ))}

                    <div className={styles.filterDivider} />
                    <div className={styles.filterTitle}>状态</div>
                    <button className={styles.catItem} onClick={() => { }}>
                        <span>✅</span> 已安装
                        <span className={styles.catCount}>{skills.filter(s => s.installed).length}</span>
                    </button>
                    <button className={styles.catItem} onClick={() => { }}>
                        <span>📥</span> 可安装
                        <span className={styles.catCount}>{skills.filter(s => !s.installed).length}</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className={styles.mainPanel}>
                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        <div className={styles.searchBox}>
                            <Search size={15} className={styles.searchIcon} />
                            <input
                                className={styles.searchInput}
                                placeholder="搜索技能名称或描述..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className={styles.viewToggle}>
                            <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}>
                                <Grid3X3 size={15} />
                            </button>
                            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}>
                                <List size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Featured */}
                    {category === 'all' && !search && (
                        <div className={styles.featuredRow}>
                            {skills.filter(s => s.featured).map(s => (
                                <div key={s.id} className={styles.featuredCard} onClick={() => setSelectedId(s.id)}>
                                    <div className={styles.featuredGlow} style={{ background: `linear-gradient(135deg, ${s.color}20, transparent)` }} />
                                    <div className={styles.featuredIcon} style={{ background: `${s.color}20`, color: s.color }}>
                                        <span>{s.icon}</span>
                                    </div>
                                    <div className={styles.featuredInfo}>
                                        <div className={styles.featuredName}>{s.name}</div>
                                        <div className={styles.featuredDesc}>{s.desc}</div>
                                    </div>
                                    <div className={styles.featuredBadge}>⭐ 精选</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills Grid/List */}
                    <div className={viewMode === 'grid' ? styles.skillGrid : styles.skillList}>
                        {filtered.map(s => (
                            <div
                                key={s.id}
                                className={`${viewMode === 'grid' ? styles.skillCard : styles.skillRow} ${selectedId === s.id ? styles.skillSelected : ''}`}
                                onClick={() => setSelectedId(s.id)}
                            >
                                <div className={styles.skillIcon} style={{ background: `${s.color}18` }}>
                                    {s.icon}
                                </div>
                                <div className={styles.skillInfo}>
                                    <div className={styles.skillName}>
                                        {s.name}
                                        {s.installed && <span className={styles.installedBadge}><Check size={10} /> 已安装</span>}
                                    </div>
                                    <div className={styles.skillDesc}>{s.desc}</div>
                                    <div className={styles.skillMeta}>
                                        <span className={styles.metaItem}>
                                            <Star size={11} fill="var(--warning)" stroke="var(--warning)" /> {s.rating}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <Download size={11} /> {formatDownloads(s.downloads)}
                                        </span>
                                        <span className={styles.metaItem}>v{s.version}</span>
                                        <span className={styles.metaItem}>{s.author}</span>
                                    </div>
                                </div>
                                {viewMode === 'list' && (
                                    <button
                                        className={`${styles.installBtn} ${s.installed ? styles.uninstallBtn : ''}`}
                                        onClick={e => { e.stopPropagation(); toggleInstall(s.id) }}
                                    >
                                        {s.installed ? '卸载' : '安装'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Sidebar */}
                {selected && (
                    <div className={styles.detailSidebar} key={selected.id}>
                        <button className={styles.detailClose} onClick={() => setSelectedId(null)}>×</button>
                        <div className={styles.detailIcon} style={{ background: `${selected.color}20` }}>
                            {selected.icon}
                        </div>
                        <h2 className={styles.detailName}>{selected.name}</h2>
                        <div className={styles.detailAuthor}>by {selected.author} · v{selected.version}</div>
                        <div className={styles.detailStats}>
                            <div className={styles.detailStat}>
                                <Star size={14} fill="var(--warning)" stroke="var(--warning)" />
                                <span>{selected.rating}</span>
                            </div>
                            <div className={styles.detailStat}>
                                <Download size={14} />
                                <span>{formatDownloads(selected.downloads)}</span>
                            </div>
                        </div>

                        <button
                            className={`${styles.detailAction} ${selected.installed ? styles.detailUninstall : ''}`}
                            onClick={() => toggleInstall(selected.id)}
                        >
                            {selected.installed ? '✕ 卸载技能' : '⬇ 安装技能'}
                        </button>

                        <div className={styles.detailSection}>
                            <div className={styles.detailSectionTitle}>描述</div>
                            <p className={styles.detailDesc}>{selected.desc}</p>
                        </div>

                        <div className={styles.detailSection}>
                            <div className={styles.detailSectionTitle}>标签</div>
                            <div className={styles.detailTags}>
                                {selected.tags.map(t => (
                                    <span key={t} className={styles.detailTag}><Tag size={10} /> {t}</span>
                                ))}
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <div className={styles.detailSectionTitle}>权限</div>
                            <div className={styles.permList}>
                                {['网络访问', '文件读取', '命令执行'].map((p, i) => (
                                    <div key={i} className={styles.permItem}>
                                        <div className={styles.permDot} /> {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
