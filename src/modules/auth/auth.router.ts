import { ServerRequestExtended } from '../../app/server_request_extended.ts';
import { HTTP_METHOD } from '../../app/http_method.ts';
import { Router } from '../../app/router.ts';
import { generateNewAuthToken } from './auth.ts';
import { fetchUser } from '../user/user.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts';

export class AuthRouter extends Router {
  constructor() {
    super('/tokens');

    this.routes = {
      '/': { [HTTP_METHOD.POST]: AuthRouter.AuthenticateUser },
    };
  }

  private static async AuthenticateUser(
    request: ServerRequestExtended
  ): Promise<void> {
    try {
      const username = request.decodedBody?.username;
      const password = request.decodedBody?.password;

      if (!username || !password) {
        request.respond({
          status: 400,
          body: 'Request body must contain a username/password combination',
        });
      }

      const user = await fetchUser(username);

      if (user) {
        if (bcrypt.compareSync(password, user.password!)) {
          const token = await generateNewAuthToken(username);
          await request.respond({ status: 200, body: token });
          return;
        }
      }

      // return unauthorized in all other cases
      await request.respond({ status: 401, body: 'Unauthorized' });
    } catch (e) {
      await request.respond({ status: 500 });
    }
  }
}
