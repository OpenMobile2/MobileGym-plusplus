/** Checkout PIN: any 6 characters succeed. Do not use for password-change flows. */
export function isPayPinComplete(password: string): boolean {
  return String(password).length >= 6;
}
