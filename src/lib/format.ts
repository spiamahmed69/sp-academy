/** Formatting helpers (BDT, Bangla digits). */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-IN')}`
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

export function discountPercent(price: number, discountPrice?: number): number {
  if (!discountPrice || discountPrice >= price) return 0
  return Math.round(((price - discountPrice) / price) * 100)
}

/** Simulated network delay so list pages show real skeleton states. */
export function fakeDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
