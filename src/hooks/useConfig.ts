/**
 * useConfig — 配置管理 Hook
 * 封装 OpenClaw 配置文件的读写和实时同步
 */
import { useState, useEffect, useCallback, useRef } from 'react'

const api = () => window.electronAPI

export function useConfig() {
    const [config, setConfig] = useState<OpenClawConfig | null>(null)
    const [configPath, setConfigPath] = useState('')
    const [homePath, setHomePath] = useState('')
    const [loading, setLoading] = useState(true)
    const [exists, setExists] = useState(false)
    const cleanupRef = useRef<(() => void) | null>(null)

    // 初始化
    useEffect(() => {
        if (!api()?.config) {
            setLoading(false)
            return
        }

        Promise.all([
            api().config.read(),
            api().config.path()
        ]).then(([cfg, paths]) => {
            setConfig(cfg)
            setConfigPath(paths.configPath)
            setHomePath(paths.homePath)
            setExists(paths.exists)
        }).catch(() => { }).finally(() => {
            setLoading(false)
        })

        // 订阅配置变更
        cleanupRef.current = api().config.onChanged((cfg) => {
            setConfig(cfg)
        })

        return () => {
            if (cleanupRef.current) cleanupRef.current()
        }
    }, [])

    const reload = useCallback(async () => {
        if (!api()?.config) return
        setLoading(true)
        try {
            const cfg = await api().config.read()
            setConfig(cfg)
        } finally {
            setLoading(false)
        }
    }, [])

    const getValue = useCallback(async (keyPath: string) => {
        if (!api()?.config) return undefined
        return api().config.get(keyPath)
    }, [])

    const setValue = useCallback(async (keyPath: string, value: any) => {
        if (!api()?.config) return false
        const result = await api().config.set(keyPath, value)
        if (result) {
            // 乐观更新
            const cfg = await api().config.read()
            setConfig(cfg)
        }
        return result
    }, [])

    const saveConfig = useCallback(async (cfg: OpenClawConfig) => {
        if (!api()?.config) return false
        const result = await api().config.write(cfg)
        if (result) setConfig(cfg)
        return result
    }, [])

    return {
        config,
        configPath,
        homePath,
        loading,
        exists,
        reload,
        getValue,
        setValue,
        saveConfig,
    }
}

/**
 * useEnvVars — 环境变量管理 Hook
 */
export function useEnvVars() {
    const [vars, setVars] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!api()?.config) {
            setLoading(false)
            return
        }
        api().config.envVars().then(v => {
            setVars(v)
        }).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const setVar = useCallback(async (key: string, value: string) => {
        if (!api()?.config) return false
        const result = await api().config.setEnvVar(key, value)
        if (result) {
            setVars(prev => ({ ...prev, [key]: value }))
        }
        return result
    }, [])

    const reload = useCallback(async () => {
        if (!api()?.config) return
        const v = await api().config.envVars()
        setVars(v)
    }, [])

    return { vars, loading, setVar, reload }
}
