import styles from './Titlebar.module.css'

export default function Titlebar() {
    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = () => window.electronAPI?.maximize()
    const handleClose = () => window.electronAPI?.close()

    return (
        <div className={styles.titlebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🦞</span>
                <span className={styles.logoText}>OpenClaw Desktop</span>
            </div>
            <div className={styles.dragRegion} />
            <div className={styles.controls}>
                <button className={`${styles.controlBtn} ${styles.minimize}`} onClick={handleMinimize}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><rect y="4" width="10" height="1.5" rx="0.75" fill="currentColor" /></svg>
                </button>
                <button className={`${styles.controlBtn} ${styles.maximize}`} onClick={handleMaximize}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                </button>
                <button className={`${styles.controlBtn} ${styles.close}`} onClick={handleClose}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
            </div>
        </div>
    )
}
