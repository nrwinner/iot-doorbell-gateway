import { ServerRequestExtended } from '../app/server-request-extended.ts';
import { checkAuthentication } from './auth_checker.ts';
import { parseBody } from './body_parser.ts';

export async function applyHTTPMiddleware(request: ServerRequestExtended) {
  await checkAuthentication(request);
  await parseBody(request);
}
