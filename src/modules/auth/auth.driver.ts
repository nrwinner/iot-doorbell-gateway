import { Deps, DEP } from '../../deps.ts';
import { TokenDocument } from '../../app/token.ts';

// FIXME(nrwinner) we shouldn't be reaching so deeply into the src directory for this, but it's
// a limitation of current deno_mongo library. Fix in future if `Database` is directly exported
import { Database } from 'https://deno.land/x/mongo@v0.21.0/src/database.ts';

export class AuthDriver {
  private static db: Promise<Database> | undefined = Deps._.get(DEP.MONGO);

  private static getCollection() {
    if (!this.db) {
      throw new Error('db not available');
    } else {
      return this.db.then((db) => {
        return db.collection('auth_tokens');
      });
    }
  }

  /**
   * Creates a new temporary auth token with a 10-second expiration window
   * @param token
   * @param username
   */
  public static setAuthToken(doc: TokenDocument): Promise<void> {
    return this.getCollection()
      .then(async (c) => {
        const existing = await c.findOne({ token: doc.token });
        if (existing) {
          // this probably shouldn't happen, sanity check
          return Promise.reject('token exists');
        }

        await c.insert(doc);
      })
      .catch((error) => {
        // database error
        return Promise.reject(error);
      });
  }

  /**
   * Validates a provided auth token
   * @param token
   * @returns the username corresponding to the auth token, or undefined
   */
  public static validateAuthToken(token: string): Promise<string | undefined> {
    return this.getCollection()
      .then(async (c) => {
        const doc = (await c.findOne({ token })) as TokenDocument;

        if (doc?.expires) {
          if (doc.expires < new Date()) {
            // this token exists but has expired, delete it
            await this.deleteAuthToken(token);
          } else {
            // this token exists and hasn't expired, finalize it
            await this.finalizeAuthToken(token);
            return doc.username;
          }
        } else if (doc) {
          return doc.username;
        }

        return undefined;
      })
      .catch((error) => {
        // database error
        return Promise.reject(error);
      });
  }

  /**
   * Deletes an auth token
   * @param token
   */
  public static deleteAuthToken(token: string): Promise<void> {
    return this.getCollection().then(async (c) => {
      await c.deleteOne({ token });
    });
  }

  /**
   * Finalizes a temporary auth-token, removing its expiration date
   * @param token
   */
  public static finalizeAuthToken(token: string): Promise<void> {
    return this.getCollection().then(async (c) => {
      await c.updateOne(
        { token, expires: { $exists: true } },
        { $unset: { expires: '' } }
      );
    });
  }
}
