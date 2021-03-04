import { serve } from 'https://deno.land/std@0.88.0/http/server.ts';
import 'https://deno.land/x/dotenv/load.ts';
import { applyHTTPMiddleware } from './middleware/mod.ts';
import { AuthRouter } from './modules/auth/auth.router.ts';

// fetch port and create server
const port = parseInt(Deno.env.get('PORT') ?? '3000')
const server = serve({ port });

async function serveHTTP() {
  console.log(`HTTP Server listening...`);

  for await (const request of server) {
    await applyHTTPMiddleware(request);

    // FIXME(nrwinner) refactor this to pass to all available routers
    const handled = await new AuthRouter().handle(request);

    if (!handled) {
      request.respond({ body: 'Not found', status: 404 });
    }
  }
}

// start both HTTP and WS servers
Promise.all([serveHTTP()]);
