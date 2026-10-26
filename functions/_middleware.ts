import { AUTH_CHALLENGE_HEADERS, isAuthorised } from '../edge/basicAuth'

/**
 * Cloudflare Pages middleware: password-protects the whole site while it is
 * a test environment.
 *
 * Set SITE_PASSWORD in the Pages project's environment variables (as a
 * secret) to turn protection on. Delete it to make the site public — no
 * code change or redeploy of code needed, just a new deployment.
 */
interface Env {
  SITE_PASSWORD?: string
}

interface Context {
  request: Request
  env: Env
  next: () => Promise<Response>
}

export const onRequest = async ({ request, env, next }: Context): Promise<Response> => {
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
