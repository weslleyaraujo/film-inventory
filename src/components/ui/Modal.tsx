import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { X } from "lucide-preact";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
  variant?: "sheet" | "center";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const isDark = document.documentElement.classList.contains("dark");
      document.body.style.backgroundColor = isDark ? "#1a1a1a" : "#ffffff";
    } else {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
    };
  }, [open]);

  const isSheet = variant === "sheet";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e: any) => {
            if (e.target === overlayRef.current) onClose();
          }}
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--bg-overlay)]"
        >
          <motion.div
            initial={isSheet ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
            animate={isSheet ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isSheet ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            class={`bg-[var(--bg-elevated)] w-full sm:max-w-md sm:rounded-[var(--radius-modal)]
              ${isSheet ? "rounded-t-[var(--radius-modal)]" : "rounded-[var(--radius-modal)] mx-4"}
              shadow-[var(--shadow-modal)]`}
          >
            <div class={isSheet ? "max-h-[90vh] overflow-y-auto" : ""}>
              {title && (
                <div class="flex items-center justify-between px-5 pt-5 pb-2">
                  <h2 class="text-section-title">{title}</h2>
                  <button
                    onClick={onClose}
                    class="p-2 -mr-2 rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--bg-card)]"
                  >
                    <X size={20} strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <div class="px-5 pb-6">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
