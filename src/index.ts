import { serve } from 'https://deno.land/std@0.88.0/http/server.ts';
import 'https://deno.land/x/dotenv/load.ts';
import { Router } from './app/router.ts';
import { ServerRequestExtended } from './app/server_request_extended.ts';
import { applyHTTPMiddleware } from './middleware/mod.ts';
import { AuthRouter } from './modules/auth/auth.router.ts';

// fetch port and create server
const port = parseInt(Deno.env.get('PORT') ?? '');

if (!port) {
  throw new Error('port must be specified and numeric');
}

const server = serve({ port });

async function serveHTTP() {
  console.log('HTTP Server listening...');

  for await (const request of server) {
    await applyHTTPMiddleware(request);
    await handleRequest(new AuthRouter())(request);
  }
}

function handleRequest(
  ...routers: Router[]
): (request: ServerRequestExtended) => Promise<void> {
  return async (request: ServerRequestExtended) => {
    let handled = false;

    for (let i = 0; !handled && i < routers.length; i++) {
      handled = await routers[i].handle(request);
    }

    if (!handled) {
      request.respond({ body: 'Not found', status: 404 });
    }
  };
}

// start both HTTP and WS servers
Promise.all([serveHTTP()]);
