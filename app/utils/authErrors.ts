/** i18n key for a Supabase Auth error (codes from @supabase/auth-js), or the given fallback. */
export function authErrorKey(error: unknown, fallbackKey: string): string {
  const { code, status } = (error ?? {}) as { code?: string, status?: number }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429) {
    return 'auth.errors.rateLimit'
  }
  if (code === 'otp_expired' || code === 'invalid_credentials') return 'auth.errors.codeExpired'
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'auth.errors.invalidEmail'
  if (code === 'signup_disabled' || code === 'user_not_found') return 'auth.errors.notAllowed'
  if (error instanceof TypeError) return 'auth.errors.network'
  return fallbackKey
}
