/** Formatting helpers (BDT, Bangla digits). */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('bn-BD')}`
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/**
 * Bengali digits → ASCII digits. Sample data stores display dates in Bengali
 * digits (e.g. '২০২৬-১২-০৬'); Date.parse only understands ASCII, so any
 * code that turns a sample date string into a Date must convert first.
 */
export function toAsciiDigits(input: string): string {
  return String(input).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

export function discountPercent(price: number, discountPrice?: number): number {
  if (!discountPrice || discountPrice >= price) return 0
  return Math.round(((price - discountPrice) / price) * 100)
}

/** Simulated network delay so list pages show real skeleton states. */
export function fakeDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
