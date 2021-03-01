import { ServerRequestExtended } from '../app/server-request-extended.ts';
import { validateAuthToken } from '../modules/auth/auth.ts';

/**
 * Some function that does something
 * @param request the ServerRequest to process
 */
export async function checkAuthentication(request: ServerRequestExtended) {
  const token = request.headers.get('Authorization')?.split(/\s/g)[1];
  if (token) {
    // auth-bearer token is supplied, validate it
    if (token === Deno.env.get('AUTH_SECRET')) {
      request.user = 'service';
      return;
    }

    // we now know this is either an invalid token or it belongs to a user
    // search for active user auth tokens
    const username = await validateAuthToken(token);
    if (username) {
      request.user = username;
      return;
    }
  }
}
