import { RefreshCw } from 'lucide-preact'
import { AnimatePresence, motion } from 'framer-motion'

interface UpdatePromptProps {
  needRefresh: boolean
  updateServiceWorker: () => Promise<void>
}

export function UpdatePrompt({ needRefresh, updateServiceWorker }: UpdatePromptProps) {
  const handleUpdate = () => {
    updateServiceWorker()
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          class="fixed bottom-[calc(64px+var(--safe-bottom))] left-4 right-4 z-50
                 flex items-center justify-between gap-3 px-4 py-3
                 bg-[var(--bg-elevated)] border border-[var(--color-border)]
                 rounded-[var(--radius-card)] shadow-[var(--shadow-modal)]"
        >
          <span class="text-caption text-[var(--text-primary)]">
            Update available
          </span>
          <button
            onClick={handleUpdate}
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-pill)]
                   bg-[var(--color-accent)] text-white text-caption font-semibold
                   active:bg-[var(--color-accent-pressed)] transition-colors"
          >
            <RefreshCw size={14} strokeWidth={2} />
            Update
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
