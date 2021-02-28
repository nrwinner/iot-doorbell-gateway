import { ServerRequestExtended } from '../../app/server-request-extended.ts';
import { HTTP_METHOD } from '../../app/http_method.ts';
import { Router } from '../../app/router.ts';
import { generateNewAuthToken } from './auth.ts';

export class AuthRouter extends Router {
  constructor() {
    super('/auth');

    // TODO(nrwinner) these routes aren't real and should be removed
    // define routes
    this.routes = {
      '/:username': { [HTTP_METHOD.POST]: AuthRouter.AuthenticateUser },
    };
  }

  private static async AuthenticateUser(
    request: ServerRequestExtended
  ): Promise<void> {
    try {
      const token = await generateNewAuthToken(request.params?.username);
      await request.respond({ status: 200, body: token });
    } catch (e) {
      await request.respond({ status: 500 });
    }
  }
}
