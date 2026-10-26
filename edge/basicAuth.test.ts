import { describe, expect, it } from 'vitest'
import { onRequest } from '../functions/_middleware'
import { isAuthorised, passwordFromHeader, safeEqual } from './basicAuth'

const basic = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`

describe('basic auth helpers', () => {
  it('reads the password, accepting any username', () => {
    expect(passwordFromHeader(basic('anyone', 's3cret'))).toBe('s3cret')
    expect(passwordFromHeader(basic('', 'with:colon'))).toBe('with:colon')
    expect(passwordFromHeader(null)).toBeNull()
    expect(passwordFromHeader('Bearer abc')).toBeNull()
    expect(passwordFromHeader('Basic !!!')).toBeNull()
  })

  it('compares passwords exactly', () => {
    expect(safeEqual('cake', 'cake')).toBe(true)
    expect(safeEqual('cake', 'cakes')).toBe(false)
    expect(safeEqual('', 'x')).toBe(false)
    expect(isAuthorised(basic('x', 'cake'), 'cake')).toBe(true)
    expect(isAuthorised(basic('x', 'Cake'), 'cake')).toBe(false)
  })
})

describe('Pages middleware', () => {
  const next = async () => new Response('site', { status: 200 })
  const request = (auth?: string) => new Request('https://example.pages.dev/', { headers: auth ? { Authorization: auth } : {} })

  it('lets everyone in when no password is configured', async () => {
    const res = await onRequest({ request: request(), env: {}, next })
    expect(res.status).toBe(200)
  })

  it('asks for a password when one is configured', async () => {
    const res = await onRequest({ request: request(), env: { SITE_PASSWORD: 'cake' }, next })
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toMatch(/^Basic /)
    expect(await res.text()).not.toContain('site')
  })

  it('rejects a wrong password and accepts the right one', async () => {
    expect((await onRequest({ request: request(basic('u', 'nope')), env: { SITE_PASSWORD: 'cake' }, next })).status).toBe(401)
    const ok = await onRequest({ request: request(basic('u', 'cake')), env: { SITE_PASSWORD: 'cake' }, next })
    expect(ok.status).toBe(200)
    expect(await ok.text()).toBe('site')
    expect(ok.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  })
})

describe('/studio redirect', () => {
  const next = async () => new Response('site', { status: 200 })
  const req = (path: string) => new Request(`https://example.pages.dev${path}`)

  it('sends /studio to the hosted Studio, keeping sub-paths', async () => {
    const res = await onRequest({ request: req('/studio'), env: {}, next })
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://beyondscrumptious-cakes.sanity.studio')
    const deep = await onRequest({ request: req('/studio/structure/cakeDesign'), env: { STUDIO_URL: 'https://other.sanity.studio/' }, next })
    expect(deep.headers.get('Location')).toBe('https://other.sanity.studio/structure/cakeDesign')
  })

  it('leaves other paths alone', async () => {
    expect((await onRequest({ request: req('/studios'), env: {}, next })).status).toBe(200)
    expect((await onRequest({ request: req('/cakes/studio'), env: {}, next })).status).toBe(200)
  })
})
