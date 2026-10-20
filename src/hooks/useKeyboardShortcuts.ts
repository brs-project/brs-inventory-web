import { useEffect } from 'react'

export interface KeyboardShortcutsHandlers {
  onOpenSearch?: () => void
  onNewTransaction?: () => void
  onGoDashboard?: () => void
  onOpenHelp?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts({
  onOpenSearch,
  onNewTransaction,
  onGoDashboard,
  onOpenHelp,
  onEscape,
}: KeyboardShortcutsHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      // Escape key
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }

      // Ctrl / Cmd + K -> Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenSearch?.()
        return
      }

      // Ctrl / Cmd + N -> New Transaction
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onNewTransaction?.()
        return
      }

      // Ctrl / Cmd + D -> Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        onGoDashboard?.()
        return
      }

      // Shift + ? / ? -> Help (only if not typing in input)
      if (e.key === '?' && !isInput) {
        e.preventDefault()
        onOpenHelp?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenSearch, onNewTransaction, onGoDashboard, onOpenHelp, onEscape])
}
