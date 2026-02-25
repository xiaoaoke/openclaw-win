import { create } from 'zustand'

type Page = 'dashboard' | 'channels' | 'models' | 'skills' | 'chat' | 'settings' | 'onboarding'

interface AppState {
    currentPage: Page
    gatewayStatus: 'running' | 'stopped' | 'starting' | 'error'
    gatewayPort: number
    isFirstRun: boolean
    openclawInstalled: boolean

    setPage: (page: Page) => void
    setGatewayStatus: (status: AppState['gatewayStatus']) => void
    setFirstRun: (v: boolean) => void
    setOpenclawInstalled: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
    currentPage: 'onboarding',
    gatewayStatus: 'stopped',
    gatewayPort: 18789,
    isFirstRun: true,
    openclawInstalled: false,

    setPage: (page) => set({ currentPage: page }),
    setGatewayStatus: (status) => set({ gatewayStatus: status }),
    setFirstRun: (v) => set({ isFirstRun: v }),
    setOpenclawInstalled: (v) => set({ openclawInstalled: v })
}))
