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
        const collection = db.collection('auth_tokens');

        // FIXME(nrwinner) remove this abhorrent hack when deno_mongo supports atlas
        const original = collection.findOne;
        collection.findOne = function (query, options) {
          return original.apply(this, [
            query,
            Object.assign({}, options, { noCursorTimeout: false }),
          ]);
        };

        return collection;
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
          console.log(existing);
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
   */
  public static validateAuthToken(token: string): Promise<boolean> {
    return this.getCollection()
      .then(async (c) => {
        const doc = (await c.findOne({ token })) as TokenDocument;

        if (doc?.expires) {
          if (doc.expires > new Date()) {
            // this token exists but has expired, delete it
            await this.deleteAuthToken(token);
          } else {
            // this token exists and hasn't expired, finalize it
            await this.finalizeAuthToken(token);
            return true;
          }
        } else if (doc) {
          return true;
        }

        return false;
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
