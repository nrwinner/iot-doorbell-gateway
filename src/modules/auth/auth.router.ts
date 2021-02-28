import { ServerRequestExtended } from '../../app/server-request-extended.ts';
import { Router } from '../../app/router.ts';
import { generateNewAuthToken } from './auth.ts';

export class AuthRouter extends Router {
  constructor() {
    super('/auth');

    // TODO(nrwinner) these routes aren't real and should be removed
    // define routes
    this.routes = {
      '/:username': AuthRouter.TestHandler,
    };
  }

  private static async TestHandler(
    request: ServerRequestExtended
  ): Promise<void> {
    try {
      generateNewAuthToken(request.params?.username);
      await request.respond({ status: 200 });
    } catch (e) {
      console.log(e);
      await request.respond({ status: 500 });
    }
  }
}
