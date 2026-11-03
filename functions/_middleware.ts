import { AUTH_CHALLENGE_HEADERS, isAuthorised } from '../edge/basicAuth'
import { FailureLimiter } from '../edge/rateLimit'
import { withSecurityHeaders } from '../edge/securityHeaders'
import { studioRedirect } from '../edge/studioRedirect'

/**
 * Cloudflare Pages middleware, run for every request:
 * - only GET and HEAD are accepted (the site has no forms or API of its own);
 * - /studio redirects to the hosted Sanity Studio (STUDIO_URL, or the
 *   default hostname from studio/sanity.cli.ts). Studio has its own login;
 * - while SITE_PASSWORD is set (a Pages secret), the whole site asks for a
 *   password, with repeated wrong guesses blocked for 15 minutes.
 *   Delete the secret and redeploy to make the site public;
 * - security headers are added to every response.
 */
interface Env {
  SITE_PASSWORD?: string
  STUDIO_URL?: string
}

interface Context {
  request: Request
  env: Env
  next: () => Promise<Response>
}

const limiter = new FailureLimiter()

export const onRequest = async (context: Context): Promise<Response> =>
  withSecurityHeaders(await handle(context))

async function handle({ request, env, next }: Context): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  const redirect = studioRedirect(new URL(request.url), env.STUDIO_URL)
  if (redirect) return new Response(null, { status: 302, headers: { Location: redirect, 'Cache-Control': 'no-store' } })

  const password = env.SITE_PASSWORD
  if (!password) return next()

  const visitor = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const wait = limiter.retryAfter(visitor)
  if (wait > 0) {
    return new Response('Too many wrong passwords. Please try again later.', {
      status: 429,
      headers: { 'Retry-After': String(wait), 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const header = request.headers.get('Authorization')
  if (!isAuthorised(header, password)) {
    // Only count actual guesses; the browser's first request has no password yet.
    if (header) limiter.recordFailure(visitor)
    return new Response('Password required. This is a private test version of the Beyond Scrumptious cake builder.', {
      status: 401,
      headers: AUTH_CHALLENGE_HEADERS,
    })
  }
  limiter.reset(visitor)

  const response = await next()
  const protectedResponse = new Response(response.body, response)
  // Keep the test site out of search engines.
  protectedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return protectedResponse
}
