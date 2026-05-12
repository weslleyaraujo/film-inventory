import { useEffect } from 'preact/hooks'
import { useRegisterSW } from 'virtual:pwa-register/preact'
import { Film, Camera, ClipboardList, Settings } from 'lucide-preact'
import { InventoryScreen } from './screens/InventoryScreen'
import { CameraListScreen } from './screens/CameraListScreen'
import { LogScreen } from './screens/LogScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StockDetailScreen } from './screens/StockDetailScreen'
import { CameraDetailScreen } from './screens/CameraDetailScreen'
import { loading } from './store/inventory'
import { activeTab } from './store/ui'
import { UpdatePrompt } from './components/UpdatePrompt'
import type { Tab } from './store/ui'

const TABS: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: 'inventory', label: 'Inventory', icon: Film },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'log', label: 'Log', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    // Handle deep links from PWA shortcuts
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    const filter = params.get('filter')
    if (action === 'add') {
      activeTab.value = 'inventory'
    }
    if (filter === 'fridge') {
      activeTab.value = 'inventory'
    }
  }, [])

  if (loading.value) {
    return (
      <div class="flex items-center justify-center min-h-screen bg-[var(--bg-app)] text-[var(--text-secondary)]">
        <div class="flex flex-col items-center gap-3">
          <Film size={48} strokeWidth={1.5} class="text-[var(--color-accent)]" />
          <span class="text-caption">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div class="flex flex-col h-dvh bg-[var(--bg-app)]">
      {/* Main content area */}
      <main class="flex-1 overflow-y-auto">
        {activeTab.value === 'inventory' && <InventoryScreen />}
        {activeTab.value === 'cameras' && <CameraListScreen />}
        {activeTab.value === 'log' && <LogScreen />}
        {activeTab.value === 'settings' && <SettingsScreen />}
        {activeTab.value === 'stock-detail' && <StockDetailScreen />}
        {activeTab.value === 'camera-detail' && <CameraDetailScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav
        class="flex items-center justify-around px-2 pt-1
               bg-[var(--bg-app)] border-t border-[var(--color-separator)]"
        style="padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px))"
      >
        {TABS.map((tab) => {
          const isActive = activeTab.value === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => (activeTab.value = tab.id)}
              class={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors
                ${
                  isActive
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span class="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <UpdatePrompt
        needRefresh={needRefresh}
        updateServiceWorker={updateServiceWorker}
      />
    </div>
  )
}
