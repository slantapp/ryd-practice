import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Bell, Check, X } from 'lucide-react'
import { notificationApi } from '../lib/api'
import type { AppNotification } from '../types'

const PREVIEW_LIMIT = 3

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function PremiumNotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [panelStyle, setPanelStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const loadUnreadCount = useCallback(async () => {
    const count = await notificationApi.getUnreadCount()
    setUnreadCount(count)
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationApi.getAll({ limit: PREVIEW_LIMIT })
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUnreadCount()
    const interval = setInterval(() => {
      void loadUnreadCount()
      if (open) void loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadUnreadCount, loadNotifications, open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleToggle = () => {
    const next = !open
    if (next && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      })
    }
    setOpen(next)
    if (next) void loadNotifications()
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      /* non-critical */
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch {
      /* non-critical */
    }
  }

  const handleDelete = async (id: string, wasUnread: boolean) => {
    try {
      await notificationApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      /* non-critical */
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="premium-notification-trigger relative inline-flex items-center justify-center p-1 transition hover:opacity-80"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-[1rem] min-w-[1rem] place-items-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="premium-notification-panel fixed z-[9999] flex w-80 max-h-[22rem] flex-col overflow-hidden rounded-xl border shadow-xl"
              style={{ top: panelStyle.top, right: panelStyle.right }}
            >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--premium-card-border)' }}
          >
            <h3 className="premium-heading text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="premium-accent text-xs font-medium hover:opacity-80"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="premium-text-soft px-4 py-6 text-center text-sm">Loading…</p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="premium-text-soft mx-auto mb-2 opacity-50" />
                <p className="premium-text-soft text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`premium-notification-item border-b last:border-b-0 ${
                      !notification.isRead ? 'is-unread' : ''
                    }`}
                  >
                    <div
                      className="flex cursor-pointer items-start gap-2 px-4 py-3"
                      onClick={() => {
                        if (!notification.isRead) void handleMarkAsRead(notification.id)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !notification.isRead) void handleMarkAsRead(notification.id)
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="premium-heading text-sm font-medium">{notification.title}</p>
                          {!notification.isRead ? (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ background: 'var(--premium-accent-strong)' }}
                            />
                          ) : null}
                        </div>
                        <p className="premium-text-muted mt-0.5 text-xs leading-relaxed">{notification.message}</p>
                        <p className="premium-text-soft mt-1.5 text-[10px]">{formatTime(notification.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-0.5">
                        {!notification.isRead ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleMarkAsRead(notification.id)
                            }}
                            className="grid h-6 w-6 place-items-center rounded-md hover:opacity-70"
                            style={{ color: 'var(--premium-accent)' }}
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDelete(notification.id, !notification.isRead)
                          }}
                          className="grid h-6 w-6 place-items-center rounded-md text-rose-500 hover:opacity-70"
                          aria-label="Delete notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="border-t px-4 py-2.5 text-center"
            style={{ borderColor: 'var(--premium-card-border)' }}
          >
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="premium-accent text-xs font-semibold hover:opacity-80"
            >
              Show all notifications
            </Link>
          </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
