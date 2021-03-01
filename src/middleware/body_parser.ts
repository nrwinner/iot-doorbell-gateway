import { HTTP_METHOD } from '../app/http_method.ts';
import { ServerRequestExtended } from '../app/server_request_extended.ts';

const ACCEPTED_METHODS = [HTTP_METHOD.POST, HTTP_METHOD.PUT, HTTP_METHOD.PATCH];

export async function parseBody(request: ServerRequestExtended) {
  if (!ACCEPTED_METHODS.includes(request.method as HTTP_METHOD)) {
    return;
  }

  const p: Uint8Array = await Deno.readAll(request.body);
  const body = JSON.parse(new TextDecoder('utf-8').decode(p));

  if (body) {
    request.decodedBody = body;
  }
}
