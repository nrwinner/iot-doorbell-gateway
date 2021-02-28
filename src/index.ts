// std
import { serve } from 'https://deno.land/std@0.88.0/http/server.ts';

// third-party
import 'https://deno.land/x/dotenv/load.ts';

// local
import { applyHTTPMiddleware } from './middleware/mod.ts';
import { AuthRouter } from './modules/auth/auth.router.ts';

async function serveHTTP() {
  // check that port is provided in env
  const portStr: string = Deno.env.get('HTTP_PORT') ?? '';
  if (!portStr) {
    throw new Error('must specify HTTP_PORT in env');
  }

  const port = parseInt(portStr);
  if (!port || isNaN(port)) {
    throw new Error('HTTP_PORT must be an integer');
  }

  const server = serve({ port });

  console.log(`HTTP Server listening on port ${port}...`);

  for await (const request of server) {
    await applyHTTPMiddleware(request);

    // FIXME(nrwinner) refactor this to pass to all available routers
    const handled = await new AuthRouter().handle(request);

    if (!handled) {
      request.respond({ body: 'Not found', status: 404 });
    }
  }
}

async function serveWS() {
  console.log('WS Server Listening...');
  await Promise.resolve();
}

// start both HTTP and WS servers
Promise.all([serveHTTP(), serveWS()]);
