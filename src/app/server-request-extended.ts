import { ServerRequest } from 'https://deno.land/std@0.88.0/http/server.ts';

export interface ServerRequestExtended extends ServerRequest {
  user?: string;
  decodedBody?: { [key: string]: any };
  params?: { [key: string]: any };
  query?: { [key: string]: any };
}
