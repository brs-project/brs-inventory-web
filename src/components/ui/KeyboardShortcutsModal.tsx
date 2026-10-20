import { X, Command, Keyboard } from 'lucide-react'

export interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘ / Ctrl', 'K'], label: 'Open Global Search' },
      { keys: ['⌘ / Ctrl', 'N'], label: 'New Inventory Transaction' },
      { keys: ['⌘ / Ctrl', 'D'], label: 'Go to Dashboard' },
    ],
  },
  {
    category: 'Interface & Actions',
    items: [
      { keys: ['?'], label: 'Show Keyboard Shortcuts' },
      { keys: ['Esc'], label: 'Close Active Modal / Panel' },
      { keys: ['⌘ / Ctrl', 'P'], label: 'Print Current View' },
    ],
  },
]

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-500">
                Quick commands to navigate and control the system
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-4 text-xs">
          {SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="block font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                {group.category}
              </span>
              <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition"
                  >
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 rounded-md bg-white border border-slate-200 shadow-xs font-mono font-bold text-slate-700 text-[11px] inline-flex items-center gap-0.5"
                        >
                          {k === '⌘ / Ctrl' && <Command className="h-3 w-3 inline text-slate-400" />}
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal
