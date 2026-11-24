/**
 * Notification data hooks — Phase 9.
 *
 * The header bell and the /notifications inbox read through the same
 * `useNotifications` query, so Firestore (when configured) and the
 * labelled sample inbox (demo mode) never drift apart in the UI.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllRead, markRead, unreadCount, type NotificationsResult } from '../firebase/notifications'
import { useAuth } from '../contexts/AuthContext'

/** All notifications for the signed-in user — or labelled demo samples. */
export function useNotifications() {
  const { user } = useAuth()
  return useQuery<NotificationsResult>({
    queryKey: ['notifications', user?.uid ?? 'demo'],
    queryFn: () => getNotifications(user?.uid ?? null),
  })
}

/** Unread count for the header bell. */
export function useUnreadNotificationCount(): number {
  const q = useNotifications()
  return q.data ? unreadCount(q.data.notifications) : 0
}

export function useMarkNotificationRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markRead(id, user?.uid ?? null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllRead(user?.uid ?? null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
