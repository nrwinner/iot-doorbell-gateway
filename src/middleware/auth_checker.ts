import { ServerRequestExtended } from '../app/server-request-extended.ts';

/**
 * Some function that does something
 * @param request the ServerRequest to process
 */
export async function checkAuthentication(request: ServerRequestExtended) {
  const authBearer = request.headers.get('Authorization');
  if (authBearer) {
    // auth-bearer token is supplied, validate it
    if (authBearer.split(/\s/g)[1] === Deno.env.get('AUTH_SECRET')) {
      request.user = 'service';
    }

    await Promise.resolve();
  }
}
