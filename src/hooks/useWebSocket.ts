/**
 * useWebSocket — Gateway WebSocket 通信 Hook
 * 连接 OpenClaw Gateway 的 WebSocket 接口，支持实时消息收发
 */
import { useState, useEffect, useRef, useCallback } from 'react'

export interface WSMessage {
    type: string
    payload?: any
    id?: string
    timestamp?: number
}

type WSStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UseWebSocketOptions {
    url?: string
    autoConnect?: boolean
    reconnect?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
    onMessage?: (msg: WSMessage) => void
    onConnect?: () => void
    onDisconnect?: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {
        url = 'ws://127.0.0.1:18789',
        autoConnect = false,
        reconnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5,
        onMessage,
        onConnect,
        onDisconnect,
    } = options

    const [status, setStatus] = useState<WSStatus>('disconnected')
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
    const [messageHistory, setMessageHistory] = useState<WSMessage[]>([])
    const [reconnectCount, setReconnectCount] = useState(0)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const callbacksRef = useRef({ onMessage, onConnect, onDisconnect })

    // Keep callbacks up to date
    useEffect(() => {
        callbacksRef.current = { onMessage, onConnect, onDisconnect }
    }, [onMessage, onConnect, onDisconnect])

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
    }, [])

    const connect = useCallback(() => {
        cleanup()

        if (wsRef.current?.readyState === WebSocket.OPEN) return

        setStatus('connecting')

        try {
            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => {
                setStatus('connected')
                setReconnectCount(0)
                callbacksRef.current.onConnect?.()
            }

            ws.onmessage = (event) => {
                try {
                    const msg: WSMessage = JSON.parse(event.data)
                    msg.timestamp = Date.now()
                    setLastMessage(msg)
                    setMessageHistory(prev => {
                        const next = [...prev, msg]
                        return next.length > 100 ? next.slice(-100) : next
                    })
                    callbacksRef.current.onMessage?.(msg)
                } catch {
                    // Non-JSON message
                    const msg: WSMessage = {
                        type: 'raw',
                        payload: event.data,
                        timestamp: Date.now(),
                    }
                    setLastMessage(msg)
                }
            }

            ws.onclose = () => {
                setStatus('disconnected')
                wsRef.current = null
                callbacksRef.current.onDisconnect?.()

                // Auto-reconnect
                if (reconnect && reconnectCount < maxReconnectAttempts) {
                    reconnectTimerRef.current = setTimeout(() => {
                        setReconnectCount(prev => prev + 1)
                        connect()
                    }, reconnectInterval)
                }
            }

            ws.onerror = () => {
                setStatus('error')
            }

        } catch {
            setStatus('error')
        }
    }, [url, reconnect, reconnectInterval, maxReconnectAttempts, reconnectCount, cleanup])

    const disconnect = useCallback(() => {
        cleanup()
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        setStatus('disconnected')
        setReconnectCount(0)
    }, [cleanup])

    const send = useCallback((msg: WSMessage) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return false
        try {
            wsRef.current.send(JSON.stringify({
                ...msg,
                id: msg.id || crypto.randomUUID(),
                timestamp: Date.now(),
            }))
            return true
        } catch {
            return false
        }
    }, [])

    // Send a request and await response by id
    const request = useCallback(async (type: string, payload?: any, timeoutMs = 10000): Promise<WSMessage | null> => {
        const id = crypto.randomUUID()
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                resolve(null)
            }, timeoutMs)

            const handler = (event: MessageEvent) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.id === id) {
                        clearTimeout(timer)
                        wsRef.current?.removeEventListener('message', handler)
                        resolve(msg)
                    }
                } catch { /* ignore */ }
            }

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.addEventListener('message', handler)
                wsRef.current.send(JSON.stringify({ type, payload, id, timestamp: Date.now() }))
            } else {
                clearTimeout(timer)
                resolve(null)
            }
        })
    }, [])

    const clearHistory = useCallback(() => setMessageHistory([]), [])

    // Auto connect on mount
    useEffect(() => {
        if (autoConnect) connect()
        return () => {
            cleanup()
            wsRef.current?.close()
        }
    }, [autoConnect]) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        status,
        isConnected: status === 'connected',
        lastMessage,
        messageHistory,
        reconnectCount,
        connect,
        disconnect,
        send,
        request,
        clearHistory,
    }
}
