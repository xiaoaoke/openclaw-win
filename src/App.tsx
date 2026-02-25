import { useAppStore } from './stores/appStore'
import Titlebar from './components/layout/Titlebar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Channels from './pages/Channels'
import Models from './pages/Models'
import Settings from './pages/Settings'
import Skills from './pages/Skills'
import Chat from './pages/Chat'
import styles from './App.module.css'

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🚧</div>
            <h2>{title}</h2>
            <p>此页面尚在开发中，将在后续版本中实现</p>
        </div>
    )
}

export default function App() {
    const { currentPage } = useAppStore()

    const renderPage = () => {
        switch (currentPage) {
            case 'onboarding': return <Onboarding />
            case 'dashboard': return <Dashboard />
            case 'channels': return <Channels />
            case 'models': return <Models />
            case 'settings': return <Settings />
            case 'skills': return <Skills />
            case 'chat': return <Chat />
            default: return <Dashboard />
        }
    }

    return (
        <div className={styles.app}>
            <Titlebar />
            <div className={styles.body}>
                <Sidebar />
                <main className={styles.main}>
                    {renderPage()}
                </main>
            </div>
            <StatusBar />
        </div>
    )
}
