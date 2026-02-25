import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './Chat.module.css'
import { Send, Plus, Paperclip, Smile, Bot, User, Copy, RotateCcw, Trash2, Sparkles, Wifi, WifiOff, Settings2, Check } from 'lucide-react'
import { useWebSocket, WSMessage } from '../hooks/useWebSocket'
import { useGateway } from '../hooks/useGateway'

interface Message {
    id: string; role: 'user' | 'assistant' | 'system'
    content: string; time: string; model?: string; tokens?: number
    streaming?: boolean
}

interface Session {
    id: string; title: string; time: string; preview: string; model: string; msgs: number
    messages: Message[]
}

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const createSystemMsg = (text: string): Message => ({
    id: crypto.randomUUID(), role: 'system', content: text, time: now()
})

const INITIAL_SESSIONS: Session[] = [
    {
        id: 'demo-1', title: '代码重构建议', time: '刚刚', preview: '帮我重构这个 TypeScript 函数...', model: 'Claude Opus 4.6', msgs: 5,
        messages: [
            createSystemMsg('会话已开始 · Claude Opus 4.6 · WebChat'),
            { id: 'msg-1', role: 'user', content: '帮我重构这个 TypeScript 函数，使其更加清晰和高效：\n\n```typescript\nfunction processData(data: any[]) {\n  let result = [];\n  for (let i = 0; i < data.length; i++) {\n    if (data[i].active === true) {\n      result.push({\n        name: data[i].name,\n        value: data[i].value * 2\n      });\n    }\n  }\n  return result;\n}\n```', time: '10:31' },
            { id: 'msg-2', role: 'assistant', content: '这是一个可以显著改进的函数。以下是重构后的版本：\n\n```typescript\ninterface DataItem {\n  name: string;\n  value: number;\n  active: boolean;\n}\n\ninterface ProcessedItem {\n  name: string;\n  value: number;\n}\n\nconst processData = (data: DataItem[]): ProcessedItem[] =>\n  data\n    .filter(item => item.active)\n    .map(({ name, value }) => ({\n      name,\n      value: value * 2,\n    }));\n```\n\n**主要改进点：**\n\n- ✅ **类型安全** — 使用明确的接口定义替代 `any[]`\n- ✅ **函数式风格** — 使用 `filter` + `map` 链式调用替代命令式循环\n- ✅ **解构赋值** — 更简洁的属性提取\n- ✅ **隐式返回** — 箭头函数直接返回表达式', time: '10:31', model: 'Claude Opus 4.6', tokens: 342 },
            { id: 'msg-3', role: 'user', content: '很棒！能不能加上错误处理和边界检查？', time: '10:33' },
            { id: 'msg-4', role: 'assistant', content: '当然！以下是增强了错误处理的版本：\n\n```typescript\nconst processData = (\n  data: DataItem[],\n  multiplier = 2\n): ProcessedItem[] => {\n  if (!Array.isArray(data)) {\n    throw new TypeError(\'Expected an array of DataItem\');\n  }\n  if (data.length === 0) return [];\n\n  return data\n    .filter(item => {\n      if (!item || typeof item.active !== \'boolean\') {\n        console.warn(\'Skipping malformed item:\', item);\n        return false;\n      }\n      return item.active;\n    })\n    .map(({ name, value }) => ({\n      name: name ?? \'Unknown\',\n      value: Number.isFinite(value) ? value * multiplier : 0,\n    }));\n};\n```\n\n**新增防御措施：**\n- ✅ 输入类型验证（非数组抛错）\n- ✅ 空数组快速返回\n- ✅ 畸形数据项过滤 + 警告日志\n- ✅ `multiplier` 参数化（默认值 2）\n- ✅ `NaN` / `Infinity` 值保护', time: '10:34', model: 'Claude Opus 4.6', tokens: 526 },
        ]
    },
    {
        id: 'demo-2', title: '旅行计划制定', time: '2小时前', preview: '我想规划一次日本京都的旅行...', model: 'GPT-5.2', msgs: 8,
        messages: [createSystemMsg('会话已开始 · GPT-5.2 · WebChat')]
    },
    {
        id: 'demo-3', title: 'API 文档编写', time: '昨天', preview: '帮我编写 REST API 的文档...', model: 'Claude Opus 4.6', msgs: 24,
        messages: [createSystemMsg('会话已开始 · Claude Opus 4.6 · WebChat')]
    },
]

const SMART_REPLIES: Record<string, string> = {
    '你好': '你好！很高兴和你交流。我可以帮你解答编程问题、分析代码、编写文档等。请问有什么我可以帮你的吗？',
    'hello': 'Hello! I\'m your AI assistant powered by OpenClaw. I can help you with coding, analysis, writing, and much more. How can I help you today?',
    '帮我': '好的，请详细描述你需要帮助的内容，我会尽力为你提供解决方案。你可以直接粘贴代码或描述问题。',
}

function generateSmartReply(input: string): string {
    const lower = input.toLowerCase()
    for (const [key, reply] of Object.entries(SMART_REPLIES)) {
        if (lower.includes(key)) return reply
    }

    if (lower.includes('```') || lower.includes('function') || lower.includes('const ')) {
        return `我看到了你的代码。让我来分析一下：\n\n这段代码的主要功能是...\n\n**优化建议：**\n- ✅ 考虑解构赋值以提升可读性\n- ✅ 添加类型注解增强类型安全\n- ✅ 使用早返回模式简化控制流\n\n需要我为你详细重构吗？`
    }

    if (lower.includes('?') || lower.includes('？')) {
        return `这是一个很好的问题！以下是我的理解和回答：\n\n根据上下文分析，关键点在于...\n\n**总结：**\n1. 首先，你需要考虑适用的场景\n2. 其次，选择合适的实现方式\n3. 最后，确保足够的测试覆盖\n\n还有其他疑问吗？我可以进一步展开说明。`
    }

    return `感谢你的消息！让我仔细思考一下...\n\n基于你的描述，我的建议如下：\n\n1. **分析需求** — 理解问题的核心\n2. **设计方案** — 选择最佳技术路径\n3. **逐步实现** — 从原型到完善\n\n如果你能提供更多细节（例如使用的技术栈、目标平台等），我可以给出更具体的建议。`
}

export default function Chat() {
    const [sessions, setSessions] = useState(INITIAL_SESSIONS)
    const [activeSessionId, setActiveSessionId] = useState('demo-1')
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [streamingContent, setStreamingContent] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState('Claude Opus 4.6')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { isRunning } = useGateway()

    // WebSocket connection to Gateway
    const ws = useWebSocket({
        url: `ws://127.0.0.1:18789`,
        autoConnect: false,
        onMessage: handleWSMessage,
    })

    const activeSession = sessions.find(s => s.id === activeSessionId)!
    const messages = activeSession?.messages || []

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingContent])

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
        }
    }, [input])

    function handleWSMessage(msg: WSMessage) {
        if (msg.type === 'chat:chunk') {
            setStreamingContent(prev => prev + (msg.payload?.content || ''))
        } else if (msg.type === 'chat:done') {
            const finalContent = streamingContent + (msg.payload?.content || '')
            addMessageToSession(activeSessionId, {
                id: crypto.randomUUID(), role: 'assistant',
                content: finalContent, time: now(),
                model: msg.payload?.model || selectedModel,
                tokens: msg.payload?.tokens
            })
            setStreamingContent('')
            setIsTyping(false)
        }
    }

    const addMessageToSession = useCallback((sessionId: string, msg: Message) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? {
                ...s,
                messages: [...s.messages, msg],
                msgs: s.msgs + 1,
                preview: msg.content.slice(0, 50),
                time: '刚刚'
            } : s
        ))
    }, [])

    const handleSend = async () => {
        if (!input.trim() || isTyping) return

        const userMsg: Message = {
            id: crypto.randomUUID(), role: 'user', content: input.trim(), time: now()
        }
        addMessageToSession(activeSessionId, userMsg)
        const userInput = input.trim()
        setInput('')
        setIsTyping(true)

        // Try WebSocket first
        if (ws.isConnected) {
            ws.send({
                type: 'chat:send',
                payload: { content: userInput, model: selectedModel, sessionId: activeSessionId }
            })
        } else {
            // Graceful local simulation with streaming effect
            const reply = generateSmartReply(userInput)
            simulateStreaming(reply, activeSessionId)
        }
    }

    const simulateStreaming = (content: string, sessionId: string) => {
        let idx = 0
        setStreamingContent('')
        const chars = content.split('')

        const tick = () => {
            if (idx < chars.length) {
                // Random chunk size for natural feel
                const chunk = Math.floor(Math.random() * 4) + 1
                const text = chars.slice(idx, idx + chunk).join('')
                idx += chunk
                setStreamingContent(prev => prev + text)
                setTimeout(tick, 15 + Math.random() * 30)
            } else {
                // Complete
                addMessageToSession(sessionId, {
                    id: crypto.randomUUID(), role: 'assistant',
                    content, time: now(), model: selectedModel,
                    tokens: Math.floor(content.length * 0.6)
                })
                setStreamingContent('')
                setIsTyping(false)
            }
        }
        setTimeout(tick, 600)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleNewSession = () => {
        const session: Session = {
            id: crypto.randomUUID(),
            title: '新对话',
            time: '刚刚',
            preview: '开始新的对话...',
            model: selectedModel,
            msgs: 1,
            messages: [createSystemMsg(`会话已开始 · ${selectedModel} · WebChat`)]
        }
        setSessions(prev => [session, ...prev])
        setActiveSessionId(session.id)
    }

    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (sessions.length <= 1) return
        setSessions(prev => prev.filter(s => s.id !== id))
        if (activeSessionId === id) setActiveSessionId(sessions[0].id === id ? sessions[1].id : sessions[0].id)
    }

    const handleCopy = async (content: string, msgId: string) => {
        await navigator.clipboard.writeText(content)
        setCopied(msgId)
        setTimeout(() => setCopied(null), 1500)
    }

    const handleRegenerate = () => {
        if (isTyping) return
        // Remove last assistant message and regenerate
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
        if (!lastUserMsg) return
        setIsTyping(true)
        const reply = generateSmartReply(lastUserMsg.content)
        simulateStreaming(reply, activeSessionId)
    }

    const renderContent = (text: string) => {
        const parts = text.split(/(```[\s\S]*?```)/g)
        return parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const lines = part.slice(3, -3).split('\n')
                const lang = lines[0].trim()
                const code = lines.slice(1).join('\n')
                return (
                    <div key={i} className={styles.codeBlock}>
                        <div className={styles.codeHeader}>
                            <span>{lang || 'code'}</span>
                            <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(code)}>
                                <Copy size={12} /> 复制
                            </button>
                        </div>
                        <pre className={styles.codeContent}><code>{code}</code></pre>
                    </div>
                )
            }
            return part.split('\n').map((line, j) => {
                if (line.startsWith('**') && line.endsWith('**'))
                    return <p key={`${i}-${j}`} className={styles.textBold}>{line.slice(2, -2)}</p>
                if (line.startsWith('- '))
                    return <p key={`${i}-${j}`} className={styles.listItem}>{line.slice(2)}</p>
                if (line.trim() === '') return <br key={`${i}-${j}`} />
                return <p key={`${i}-${j}`} className={styles.textLine}>{line}</p>
            })
        })
    }

    return (
        <div className={styles.chat}>
            {/* Session List */}
            <div className={styles.sessionPanel}>
                <div className={styles.sessionHeader}>
                    <span className={styles.sessionTitle}>对话</span>
                    <button className={styles.newBtn} onClick={handleNewSession} title="新建对话"><Plus size={16} /></button>
                </div>
                <div className={styles.sessionSearch}>
                    <input className={styles.sessionSearchInput} placeholder="搜索对话..." />
                </div>
                <div className={styles.sessionList}>
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            className={`${styles.sessionItem} ${activeSessionId === s.id ? styles.sessionActive : ''}`}
                            onClick={() => setActiveSessionId(s.id)}
                        >
                            <div className={styles.sessionItemTitle}>{s.title}</div>
                            <div className={styles.sessionItemPreview}>{s.preview}</div>
                            <div className={styles.sessionItemMeta}>
                                <span>{s.model}</span> · <span>{s.time}</span> · <span>{s.msgs} 条</span>
                            </div>
                            <button
                                className={styles.sessionDelete}
                                onClick={e => handleDeleteSession(e, s.id)}
                                title="删除会话"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderLeft}>
                        <Sparkles size={16} className={styles.chatHeaderIcon} />
                        <span className={styles.chatSessionTitle}>{activeSession?.title}</span>
                    </div>
                    <div className={styles.chatHeaderRight}>
                        <div className={`${styles.wsBadge} ${ws.isConnected ? styles.wsConnected : ''}`}>
                            {ws.isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {ws.isConnected ? 'WS' : '本地'}
                        </div>
                        <select
                            className={styles.modelSelect}
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                        >
                            <option>Claude Opus 4.6</option>
                            <option>GPT-5.2</option>
                            <option>Gemini 2.5 Pro</option>
                            <option>DeepSeek V4</option>
                        </select>
                        <span className={styles.channelBadge}>🦞 WebChat</span>
                    </div>
                </div>

                {/* Messages */}
                <div className={styles.messageArea}>
                    {messages.map(msg => {
                        if (msg.role === 'system') {
                            return (
                                <div key={msg.id} className={styles.systemMsg}>
                                    <span>{msg.content}</span>
                                </div>
                            )
                        }
                        return (
                            <div key={msg.id} className={`${styles.msgRow} ${msg.role === 'user' ? styles.msgUser : styles.msgAssistant}`}>
                                <div className={styles.msgAvatar}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={styles.msgBubble}>
                                    <div className={styles.msgContent}>{renderContent(msg.content)}</div>
                                    <div className={styles.msgFooter}>
                                        <span className={styles.msgTime}>{msg.time}</span>
                                        {msg.tokens && <span className={styles.msgTokens}>{msg.tokens} tokens</span>}
                                        {msg.model && <span className={styles.msgModel}>{msg.model}</span>}
                                        {msg.role === 'assistant' && (
                                            <div className={styles.msgActions}>
                                                <button
                                                    className={styles.msgActionBtn}
                                                    title="复制"
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                >
                                                    {copied === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                                </button>
                                                <button className={styles.msgActionBtn} title="重新生成" onClick={handleRegenerate}>
                                                    <RotateCcw size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Streaming response */}
                    {isTyping && streamingContent && (
                        <div className={`${styles.msgRow} ${styles.msgAssistant}`}>
                            <div className={styles.msgAvatar}><Bot size={16} /></div>
                            <div className={styles.msgBubble}>
                                <div className={styles.msgContent}>{renderContent(streamingContent)}</div>
                                <div className={styles.streamingCursor} />
                            </div>
                        </div>
                    )}

                    {/* Typing indicator */}
                    {isTyping && !streamingContent && (
                        <div className={`${styles.msgRow} ${styles.msgAssistant}`}>
                            <div className={styles.msgAvatar}><Bot size={16} /></div>
                            <div className={styles.msgBubble}>
                                <div className={styles.typingIndicator}>
                                    <span /><span /><span />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    <div className={styles.inputBox}>
                        <button className={styles.inputIconBtn}><Paperclip size={16} /></button>
                        <textarea
                            ref={inputRef}
                            className={styles.textarea}
                            placeholder="输入消息... (Shift + Enter 换行)"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button className={styles.inputIconBtn}><Smile size={16} /></button>
                        <button
                            className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className={styles.inputHint}>
                        {selectedModel} · {ws.isConnected ? '🟢 Gateway 已连接' : '💻 本地模式'} · 按 Enter 发送
                    </div>
                </div>
            </div>
        </div>
    )
}
