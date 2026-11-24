/**
 * Checkout — Phase 8.
 *
 * Flow: delivery details (Zod-validated) → payment method → place order.
 *
 * HONESTY: online payments (bKash / Nagad / card) are NOT verified here —
 * there is no backend yet. Choosing one places the order as
 * 'pending_verification' and the UI says so in plain words; it NEVER
 * shows a fake successful payment, a fake transaction id, or a fake
 * confirmation. COD orders are created with paymentStatus 'cod_due'.
 * A course in the order does NOT enroll the student — enrollment is
 * activated server-side after payment verification (backend).
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { getFirebase } from '../firebase/config'
import {
  PAYMENT_METHODS,
  isOnlinePaymentMethod,
  placeDemoOrder,
  placeOrder,
  validateCheckout,
  type PaymentMethod,
} from '../firebase/orders'
import { isValidBdPhone } from '../lib/cart'
import { formatBDT } from '../lib/format'
import { useToast } from '../lib/toast'
import { Breadcrumbs, DemoNotice, EmptyState, PageHero } from '../components/ui'

const checkoutSchemaBase = z.object({
  name: z.string().trim().min(1, 'নাম দিতে হবে।'),
  phone: z.string().trim().refine((v) => isValidBdPhone(v), 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)।'),
  address: z.string().trim(),
  district: z.string().trim(),
  paymentMethod: z.enum(['bkash', 'nagad', 'card', 'cod']),
})

type CheckoutForm = z.infer<typeof checkoutSchemaBase>

const inputClass =
  'w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-slate-700 dark:bg-[#12233c]'

export default function Checkout() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { user, configured } = useAuth()
  const { items, totals, clearCart } = useCart()
  const [busy, setBusy] = useState(false)

  const hasCourse = useMemo(() => items.some((it) => it.kind === 'course'), [items])
  const hasBook = useMemo(() => items.some((it) => it.kind === 'book'), [items])

  // Address/district are required for COD, and for any order containing a
  // book (books are delivered) — even with online payment.
  const schema = useMemo(
    () =>
      checkoutSchemaBase.superRefine((v, ctx) => {
        const needsAddress = v.paymentMethod === 'cod' || hasBook
        if (needsAddress && !v.address.trim()) {
          ctx.addIssue({ code: 'custom', path: ['address'], message: 'ডেলিভারির ঠিকানা দিতে হবে।' })
        }
        if (needsAddress && !v.district.trim()) {
          ctx.addIssue({ code: 'custom', path: ['district'], message: 'জেলা দিতে হবে।' })
        }
      }),
    [hasBook],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', address: '', district: '', paymentMethod: 'cod' },
  })

  const paymentMethod = watch('paymentMethod') as PaymentMethod
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)
  // A signed-in user placing a real order needs Firebase; otherwise this is a demo order.
  const isDemo = !configured

  const onSubmit = async (form: CheckoutForm) => {
    if (items.length === 0) return
    const input = {
      items,
      paymentMethod: form.paymentMethod,
      customer: { name: form.name, phone: form.phone, address: form.address, district: form.district },
    }
    const errors = validateCheckout(input)
    if (errors.length > 0) {
      push(errors[0], 'error')
      return
    }
    setBusy(true)
    try {
      if (isDemo) {
        await placeDemoOrder(input)
        clearCart()
        push('ডেমো অর্ডার জমা হয়েছে — এটি শুধু এই ব্রাউজারে সংরক্ষিত। আসল অর্ডার Firebase সেটআপের পর চালু হবে।', 'success')
        navigate('/my-orders')
        return
      }
      if (!user) {
        push('অর্ডার করতে আগে লগইন করুন।', 'info')
        navigate('/login', { state: { from: '/checkout' } })
        return
      }
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase কনফিগার করা হয়নি।')
      await placeOrder(fb.db, user.uid, input)
      clearCart()
      if (isOnlinePaymentMethod(form.paymentMethod)) {
        push('অর্ডার জমা হয়েছে — পেমেন্ট যাচাইয়ের অপেক্ষায় আছে। যাচাই হলে নিশ্চিত করা হবে; এখনো কোনো পেমেন্ট নিশ্চিত হয়নি।', 'success')
      } else {
        push('অর্ডার জমা হয়েছে — পণ্য হাতে পেয়ে নগদে পরিশোধ করবেন।', 'success')
      }
      navigate('/my-orders')
    } catch (err) {
      push(err instanceof Error ? err.message : 'অর্ডার করা যায়নি। আবার চেষ্টা করুন।', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHero eyebrow="চেকআউট" title="চেকআউট" subtitle="অর্ডার সম্পন্ন করতে ডেলিভারির তথ্য ও পেমেন্টের মাধ্যম বেছে নিন।" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState title="কার্ট খালি" message="চেকআউট করতে প্রথমে কার্টে কিছু যোগ করুন।" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero eyebrow="চেকআউট" title="চেকআউট" subtitle="অর্ডার সম্পন্ন করতে ডেলিভারির তথ্য ও পেমেন্টের মাধ্যম বেছে নিন।" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'কার্ট', to: '/cart' }, { label: 'চেকআউট' }]} />
        {isDemo && (
          <DemoNotice>
            ডেমো মোড — Firebase এখনো কনফিগার করা হয়নি। এই অর্ডারটি <strong>ডেমো অর্ডার</strong> হিসেবে এই
            ব্রাউজারেই সংরক্ষিত হবে; কোনো আসল পেমেন্ট বা ডেলিভারি হবে না।
          </DemoNotice>
        )}
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card p-6">
              <h2 className="text-lg font-extrabold">ডেলিভারির তথ্য</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-name" className="mb-1.5 block text-sm font-bold">
                    আপনার নাম *
                  </label>
                  <input id="co-name" {...register('name')} placeholder="পূর্ণ নাম" className={inputClass} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="co-phone" className="mb-1.5 block text-sm font-bold">
                    মোবাইল নম্বর *
                  </label>
                  <input id="co-phone" {...register('phone')} placeholder="01XXXXXXXXX" inputMode="tel" className={inputClass} />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-address" className="mb-1.5 block text-sm font-bold">
                    ঠিকানা {paymentMethod === 'cod' || hasBook ? '*' : '(কোর্সের জন্য ঐচ্ছিক)'}
                  </label>
                  <textarea id="co-address" {...register('address')} rows={2} placeholder="বাসা/রোড, এলাকা, থানা" className={inputClass} />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                </div>
                <div>
                  <label htmlFor="co-district" className="mb-1.5 block text-sm font-bold">
                    জেলা {paymentMethod === 'cod' || hasBook ? '*' : '(কোর্সের জন্য ঐচ্ছিক)'}
                  </label>
                  <input id="co-district" {...register('district')} placeholder="যেমন: ঢাকা" className={inputClass} />
                  {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>}
                </div>
              </div>
            </section>

            <section className="card p-6">
              <h2 className="text-lg font-extrabold">পেমেন্টের মাধ্যম</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="পেমেন্টের মাধ্যম">
                {PAYMENT_METHODS.map((m) => {
                  const disabled = m.id === 'cod' && hasCourse && !hasBook
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        paymentMethod === m.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                          : 'border-blue-100 hover:border-[var(--color-primary)] dark:border-slate-700'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        value={m.id}
                        {...register('paymentMethod')}
                        disabled={disabled}
                        className="mt-1 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-bold">{m.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--color-body)]">{m.note}</span>
                        {disabled && (
                          <span className="mt-1 block text-xs font-bold text-amber-700">
                            কোর্সের জন্য COD প্রযোজ্য নয় — অনলাইন পেমেন্ট বেছে নিন।
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
              {selectedMethod && isOnlinePaymentMethod(selectedMethod.id) && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  অনলাইন পেমেন্টের যাচাইকরণ এখনো চালু হয়নি (ব্যাকএন্ডে আসছে)। অর্ডারটি
                  &quot;পেমেন্ট যাচাইয়ের অপেক্ষায়&quot; হিসেবে জমা হবে — এখনো কোনো টাকা কাটা হয়নি, কোনো
                  পেমেন্ট নিশ্চিত হয়নি, আর কোনো ট্রানজাকশন আইডি দেওয়া হবে না। যাচাই সম্পন্ন হলে অর্ডার
                  নিশ্চিত করা হবে।
                </p>
              )}
              {hasCourse && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-[var(--color-body)] dark:bg-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  কোর্সের ভর্তি এই অর্ডারে চালু হবে না — পেমেন্ট যাচাইয়ের পর ব্যাকএন্ড থেকে
                  ভর্তি সক্রিয় করা হবে। ফ্রি কোর্সে ভর্তি হতে কোর্স পেজ থেকে ফ্রি ভর্তি হোন।
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="text-lg font-extrabold">অর্ডারের সারাংশ</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.refId}`} className="flex justify-between gap-3">
                    <span className="text-[var(--color-body)]">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-bold">{formatBDT(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-body)]">সাবটোটাল</dt>
                  <dd className="font-bold">{formatBDT(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-body)]">ডেলিভারি চার্জ</dt>
                  <dd className="font-bold">{totals.deliveryFee === 0 ? 'ফ্রি' : formatBDT(totals.deliveryFee)}</dd>
                </div>
                <div className="flex justify-between text-base font-extrabold">
                  <dt>মোট</dt>
                  <dd className="text-[var(--color-cta-to)]">{formatBDT(totals.total)}</dd>
                </div>
              </dl>
              <button type="submit" disabled={busy} className="btn-cta mt-5 w-full disabled:opacity-60">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}{' '}
                {busy ? 'অর্ডার জমা হচ্ছে...' : `অর্ডার করুন · ${formatBDT(totals.total)}`}
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-[var(--color-muted)]">
                অর্ডার করলে কোনো ভুয়া পেমেন্ট নিশ্চয়তা দেখানো হবে না — অনলাইন পেমেন্ট যাচাইয়ের পরেই
                অর্ডার নিশ্চিত হবে।
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}
