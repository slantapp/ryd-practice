import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { notificationApi } from '../lib/api'
import type { AppNotification } from '../types'

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationApi.getAll({
        isRead: filter === 'unread' ? false : undefined,
        limit: 100,
      })
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      )
    } catch {
      /* non-critical */
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
    } catch {
      /* non-critical */
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      /* non-critical */
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <PremiumAppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="premium-card rounded-2xl border p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Inbox</p>
              <h1 className="premium-heading mt-1 text-2xl font-bold">Notifications</h1>
              <p className="premium-text-muted mt-1 text-sm">Announcements and updates from RYD Practice</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="premium-btn-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              >
                <Check size={14} />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex gap-1.5">
            {(['all', 'unread'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`premium-pill-compact rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  filter === tab ? 'premium-pill-active' : 'premium-pill'
                }`}
              >
                {tab === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
        </section>

        <section className="premium-card rounded-2xl border overflow-hidden">
          {loading ? (
            <p className="premium-text-soft px-6 py-10 text-center text-sm">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell size={32} className="premium-text-soft mx-auto mb-3 opacity-50" />
              <p className="premium-text-muted text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
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
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="premium-heading font-semibold">{notification.title}</p>
                        {!notification.isRead ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ background: 'var(--premium-accent-strong)' }}
                          >
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="premium-text-muted mt-1 text-sm leading-relaxed">{notification.message}</p>
                      <p className="premium-text-soft mt-2 text-xs">{formatTime(notification.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!notification.isRead ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkAsRead(notification.id)}
                          className="planner-action-btn"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDelete(notification.id)}
                        className="planner-action-btn danger"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PremiumAppShell>
  )
}
