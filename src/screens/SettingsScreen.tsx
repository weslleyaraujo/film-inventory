import { signal } from '@preact/signals'
import { Sun, Moon, Monitor, Download, Upload, Trash2 } from 'lucide-preact'
import { themeMode, setThemeMode } from '../store/ui'
import type { ThemeMode } from '../store/ui'
import { exportDatabase, downloadJSON } from '../db/export'
import { validateExportData, importDatabase } from '../db/import'

const message = signal<string | null>(null)
const error = signal<string | null>(null)

function showMessage(msg: string) {
  message.value = msg
  setTimeout(() => (message.value = null), 3000)
}

function showError(msg: string) {
  error.value = msg
  setTimeout(() => (error.value = null), 3000)
}

export function SettingsScreen() {
  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'system', label: 'System', icon: Monitor },
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ]

  const handleExport = async () => {
    try {
      const data = await exportDatabase()
      downloadJSON(data)
      showMessage('Database exported successfully')
    } catch (err) {
      showError('Failed to export database')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!validateExportData(data)) {
          showError('Invalid file format')
          return
        }
        if (!confirm('This will replace all existing data. Continue?')) return
        await importDatabase(data)
        showMessage('Database imported successfully')
      } catch (err) {
        showError('Failed to import file')
      }
    }
    input.click()
  }

  const handleClear = async () => {
    if (!confirm('This will permanently delete ALL data. Are you sure?')) return
    if (!confirm('Really? This cannot be undone.')) return
    try {
      await importDatabase({
        version: 1,
        exportedAt: new Date().toISOString(),
        filmStocks: [],
        filmVariants: [],
        inventoryItems: [],
        cameras: [],
        loadedFilms: [],
        finishedRolls: [],
      })
      showMessage('All data cleared')
    } catch (err) {
      showError('Failed to clear data')
    }
  }

  return (
    <div class="flex flex-col min-h-full">
      {/* Header */}
      <header class="px-5 pt-[calc(16px+var(--safe-top))] pb-4">
        <h1 class="text-screen-title">Settings</h1>
      </header>

      {/* Messages */}
      {message.value && (
        <div class="mx-5 mb-3 px-4 py-2 bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded-xl text-caption font-medium">
          {message}
        </div>
      )}
      {error.value && (
        <div class="mx-5 mb-3 px-4 py-2 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-xl text-caption font-medium">
          {error}
        </div>
      )}

      <section class="px-5 pb-4 flex flex-col gap-6">
        {/* Theme */}
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-section-title mb-3">Appearance</p>
          <div class="flex gap-2">
            {themeOptions.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                class={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-caption font-medium transition-colors
                  ${themeMode.value === mode
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--color-border)]'
                  }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-section-title mb-3">Data</p>
          <div class="flex flex-col gap-2">
            <button
              onClick={handleExport}
              class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--color-border)]"
            >
              <Download size={18} strokeWidth={1.5} />
              <span class="text-body flex-1 text-left">Export Database (JSON)</span>
            </button>
            <button
              onClick={handleImport}
              class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--color-border)]"
            >
              <Upload size={18} strokeWidth={1.5} />
              <span class="text-body flex-1 text-left">Import Database (JSON)</span>
            </button>
            <button
              onClick={handleClear}
              class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-destructive)]/5 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors border border-[var(--color-destructive)]/20"
            >
              <Trash2 size={18} strokeWidth={1.5} />
              <span class="text-body flex-1 text-left">Clear All Data</span>
            </button>
          </div>
        </div>

      </section>
    </div>
  )
}
