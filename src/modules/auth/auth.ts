import { AuthDriver } from './auth.driver.ts';
import { TokenDocument } from '../../app/token.ts';

/*
  Couple different types of authentication happening here:

    -- Service-to-service --
    The source service will transmit a secret key

    -- User-to-service --
    The user will transmit a username/password combination

    In both cases, an auth-token will be returned to the source. That token
    can be used to establish a websocket connection within n-seconds. If a connection with
    the corresponding key is not established within the deadline, the key expires.

    If a websocket connection is established within the deadline, the key will not expire
    and will instead survive for the duration of the connection. When the connection
    is lost, the key is invalid and deleted.

    An expired key will be deleted 1 of a few different ways:
    1. It is deleted when it is attempted to be used after expiring
    2. It is deleted during a CRON clean-up after expiring
*/

/**
 * Validates a provided auth token
 */
export function validateAuthToken(token: string): Promise<boolean> {
  return AuthDriver.validateAuthToken(token);
}

/**
 * Removes a specified token
 * @param token
 */
export function unsetAuthToken(token: string): Promise<void> {
  return AuthDriver.deleteAuthToken(token);
}

/**
 * Generates a new token for the provided username
 * @param username
 */
export function generateNewAuthToken(username: string): Promise<void> {
  if (!username) {
    return Promise.reject('username cannot be empty');
  }

  // TODO(nrwinner) generate an actual auth token here
  const token = '123456';

  if (token === Deno.env.get('AUTH_SECRET')) {
    // this should theoretically never happen, sanity check
    throw new Error('new token is the same as the AUTH_SECRET');
  }

  // expiration date is 1 minute from creation
  const expires = new Date();
  expires.setMinutes(new Date().getMinutes() + 1);

  const tokenDoc: TokenDocument = { token, username, expires };

  return AuthDriver.setAuthToken(tokenDoc);
}
