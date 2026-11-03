import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { onRequest } from '../functions/_middleware'
import { FailureLimiter } from './rateLimit'
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from './securityHeaders'

const basic = (pass: string) => `Basic ${btoa(`u:${pass}`)}`
const next = async () => new Response('site', { status: 200 })
const req = (init: { method?: string; auth?: string; ip?: string; path?: string } = {}) =>
  new Request(`https://example.pages.dev${init.path ?? '/'}`, {
    method: init.method ?? 'GET',
    headers: { ...(init.auth ? { Authorization: init.auth } : {}), 'CF-Connecting-IP': init.ip ?? '203.0.113.1' },
  })

describe('FailureLimiter', () => {
  it('blocks after the limit and unblocks after the window', () => {
    const l = new FailureLimiter(3, 60_000)
    for (let i = 0; i < 3; i++) l.recordFailure('ip', 1000)
    expect(l.retryAfter('ip', 1000)).toBe(60)
    expect(l.retryAfter('other', 1000)).toBe(0)
    expect(l.retryAfter('ip', 61_001)).toBe(0)
  })

  it('stays bounded in memory', () => {
    const l = new FailureLimiter(3, 60_000, 100)
    for (let i = 0; i < 500; i++) l.recordFailure(`ip-${i}`, 0)
    expect((l as unknown as { entries: Map<string, unknown> }).entries.size).toBeLessThanOrEqual(100)
  })
})

describe('middleware hardening', () => {
  it('adds security headers to every kind of response', async () => {
    const responses = [
      await onRequest({ request: req(), env: {}, next }),
      await onRequest({ request: req(), env: { SITE_PASSWORD: 'cake' }, next }),
      await onRequest({ request: req({ path: '/studio' }), env: {}, next }),
      await onRequest({ request: req({ method: 'POST' }), env: {}, next }),
    ]
    for (const res of responses) {
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name), name).toBe(value)
    }
  })

  it('only allows GET and HEAD', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const res = await onRequest({ request: req({ method }), env: {}, next })
      expect(res.status).toBe(405)
      expect(res.headers.get('Allow')).toBe('GET, HEAD')
    }
    expect((await onRequest({ request: req({ method: 'HEAD' }), env: {}, next })).status).toBe(200)
  })

  it('rate-limits repeated wrong passwords per visitor, without blocking others', async () => {
    const env = { SITE_PASSWORD: 'cake' }
    const ip = '198.51.100.7'
    for (let i = 0; i < 10; i++) {
      expect((await onRequest({ request: req({ auth: basic('wrong'), ip }), env, next })).status).toBe(401)
    }
    const blocked = await onRequest({ request: req({ auth: basic('cake'), ip }), env, next })
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
    // A different visitor is unaffected.
    expect((await onRequest({ request: req({ auth: basic('cake'), ip: '198.51.100.8' }), env, next })).status).toBe(200)
  })

  it('does not count the browser’s first, password-less request as a guess', async () => {
    const env = { SITE_PASSWORD: 'cake' }
    const ip = '198.51.100.20'
    for (let i = 0; i < 20; i++) await onRequest({ request: req({ ip }), env, next })
    expect((await onRequest({ request: req({ auth: basic('cake'), ip }), env, next })).status).toBe(200)
  })
})

describe('_headers file', () => {
  it('matches the headers the middleware sends', () => {
    const file = readFileSync(new URL('../apps/web/public/_headers', import.meta.url), 'utf8')
    expect(file).toContain(`Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(file).toContain(`${name}: ${value}`)
  })
})
