import { useState, type ReactNode } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { GlobalSearch } from './GlobalSearch'
import { NotificationPanel } from './NotificationPanel'
import { KeyboardShortcutsModal } from '@components/ui/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts'

interface AppLayoutProps {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(4)

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onOpenSearch: () => setSearchOpen(true),
    onNewTransaction: () => navigate('/inventory/add'),
    onGoDashboard: () => navigate('/dashboard'),
    onOpenHelp: () => setShortcutsOpen(true),
    onEscape: () => {
      setSearchOpen(false)
      setNotificationsOpen(false)
      setShortcutsOpen(false)
      setMobileMenuOpen(false)
    },
  })

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden">
      {/* 1. Desktop Fixed Left Sidebar (256px / w-64) */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 3. Main Content Wrapper (Topbar + Breadcrumbs + Scrollable View) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadNotificationCount={unreadCount}
          onOpenHelp={() => setShortcutsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Global Search Overlay (Ctrl+K) */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Notification Slide-In Drawer */}
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Keyboard Shortcuts Guide Modal (?) */}
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  )
}

export default AppLayout
