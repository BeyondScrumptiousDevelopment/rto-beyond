import { AUTH_CHALLENGE_HEADERS, isAuthorised } from '../edge/basicAuth'
import { studioRedirect } from '../edge/studioRedirect'

/**
 * Cloudflare Pages middleware:
 * - /studio redirects to the hosted Sanity Studio (STUDIO_URL, or the
 *   default hostname from studio/sanity.cli.ts). Studio has its own login.
 * - While SITE_PASSWORD is set (a Pages secret), the whole site asks for a
 *   password. Delete it and redeploy to make the site public.
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

export const onRequest = async ({ request, env, next }: Context): Promise<Response> => {
  const redirect = studioRedirect(new URL(request.url), env.STUDIO_URL)
  if (redirect) return Response.redirect(redirect, 302)

  const password = env.SITE_PASSWORD
  if (!password) return next()

  if (!isAuthorised(request.headers.get('Authorization'), password)) {
    return new Response('Password required. This is a private test version of the Beyond Scrumptious cake builder.', {
      status: 401,
      headers: AUTH_CHALLENGE_HEADERS,
    })
  }

  const response = await next()
  const protectedResponse = new Response(response.body, response)
  // Keep the test site out of search engines.
  protectedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return protectedResponse
}
