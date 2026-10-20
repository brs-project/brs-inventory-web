import { useState } from 'react'
import {
  X,
  Bell,
  CheckCheck,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Package,
  FileClock,
} from 'lucide-react'
import { cn } from '@lib/utils'

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'transaction' | 'alert' | 'report' | 'draft'
  read: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Transaction Added',
    message: 'New weighment entry recorded by Suresh (Bill #1048, Melting 18.250 MT)',
    time: '14/09 10:30 AM',
    type: 'transaction',
    read: false,
  },
  {
    id: 'n2',
    title: 'Stock Warning',
    message: 'Melting scrap physical inventory is below the 500 MT minimum threshold.',
    time: '14/09 09:15 AM',
    type: 'alert',
    read: false,
  },
  {
    id: 'n3',
    title: 'Weekly Report Available',
    message: 'Weekly weighbridge operations digest is prepared and ready for download.',
    time: '14/09 08:00 AM',
    type: 'report',
    read: false,
  },
  {
    id: 'n4',
    title: 'Pending Draft Weighments',
    message: '5 transaction drafts are currently awaiting second-weight completion.',
    time: '13/09 05:45 PM',
    type: 'draft',
    read: false,
  },
]

export interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

export function NotificationPanel({ open, onClose, onUnreadCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    setNotifications(updated)
    onUnreadCountChange?.(updated.filter((n) => !n.read).length)
  }

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    onUnreadCountChange?.(0)
  }

  if (!open) return null

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'transaction':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'report':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
      case 'draft':
        return <FileClock className="h-4 w-4 text-purple-600" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs select-none animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">System alerts and activity logs</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'p-3.5 rounded-2xl border transition text-xs space-y-1.5',
                  n.read
                    ? 'bg-slate-50/50 border-slate-200/60 opacity-80'
                    : 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <span className="font-bold text-slate-900">{n.title}</span>
                  </div>

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer shrink-0"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                  {n.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pl-8 pt-0.5">
                  <span>{n.time}</span>
                  {n.read ? (
                    <span className="text-slate-400">Read</span>
                  ) : (
                    <span className="font-bold text-blue-600">Unread</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Bell className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600 text-xs">No new notifications</p>
              <p className="text-[11px]">You're all caught up with your alerts!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          Automated Notification Stream &bull; Live
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel
