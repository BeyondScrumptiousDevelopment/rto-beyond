/**
 * HTTP Basic Auth check for the password-protected test environment.
 * Any username is accepted; only the password is checked.
 */

/** Constant-time string comparison, so response timing doesn't leak the password. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

/** Returns the password from an `Authorization: Basic …` header, or null. */
export function passwordFromHeader(header: string | null): string | null {
  if (!header) return null
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(header.trim())
  if (!match) return null
  let decoded: string
  try {
    const bytes = Uint8Array.from(atob(match[1]!), (c) => c.charCodeAt(0))
    decoded = new TextDecoder().decode(bytes)
  } catch {
    return null
  }
  const colon = decoded.indexOf(':')
  return colon === -1 ? null : decoded.slice(colon + 1)
}

export function isAuthorised(header: string | null, password: string): boolean {
  const given = passwordFromHeader(header)
  return given !== null && safeEqual(given, password)
}

export const AUTH_CHALLENGE_HEADERS = {
  'WWW-Authenticate': 'Basic realm="Beyond Scrumptious cake builder (test)", charset="UTF-8"',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Type': 'text/plain; charset=utf-8',
}
