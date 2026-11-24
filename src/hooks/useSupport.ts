/**
 * Support-ticket data hooks — Phase 9.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTicketReply,
  createTicketForUser,
  getTicketsForAdmin,
  getTicketsForUser,
  setTicketStatus,
  type SupportTicket,
  type TicketInput,
  type TicketStatus,
  type TicketsResult,
} from '../firebase/support'
import { getFirebase } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

/** The signed-in user's own tickets — or this browser's demo tickets. */
export function useMyTickets() {
  const { user } = useAuth()
  return useQuery<TicketsResult>({
    queryKey: ['my-tickets', user?.uid ?? 'demo'],
    queryFn: () => getTicketsForUser(user?.uid ?? null),
  })
}

/** All tickets for the admin reports tab — or demo tickets in demo mode. */
export function useAllTickets() {
  return useQuery<TicketsResult>({
    queryKey: ['admin-tickets'],
    queryFn: getTicketsForAdmin,
  })
}

export function useCreateTicket() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TicketInput) =>
      createTicketForUser(user?.uid ?? null, profile?.displayName ?? 'নামহীন ব্যবহারকারী', user?.email ?? '', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
    },
  })
}

export function useReplyToTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticket, message, by }: { ticket: SupportTicket; message: string; by: string }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('ডেমো মোডে অ্যাডমিন উত্তর দেওয়া যায় না — আসল টিকিটের উত্তরের জন্য Firebase সেটআপ লাগবে।')
      await addTicketReply(fb.db, ticket.id, ticket, by, 'admin', message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['my-tickets'] })
    },
  })
}

export function useSetTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const fb = getFirebase()
      if (!fb) throw new Error('ডেমো মোডে টিকিটের অবস্থা বদলানো যায় না — Firebase সেটআপ লাগবে।')
      await setTicketStatus(fb.db, ticketId, status)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['my-tickets'] })
    },
  })
}
