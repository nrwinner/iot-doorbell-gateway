import { MongoDriver } from '../../app/providers/mongo.driver.ts';
import { TokenDocument } from '../../app/entities/token_document.ts';

const COLLECTION = 'auth_tokens';

export class AuthDriver extends MongoDriver {
  /**
   * Creates a new temporary auth token with a 10-second expiration window
   * @param token
   * @param username
   */
  public static setAuthToken(doc: TokenDocument): Promise<void> {
    return this.getCollection(COLLECTION)
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
   * @param finalize whether or not to finalize temp tokens when found
   * @returns the username corresponding to the auth token, or undefined
   */
  public static validateAuthToken(
    token: string,
    finalize?: boolean
  ): Promise<string | undefined> {
    return this.getCollection(COLLECTION)
      .then(async (c) => {
        const doc = (await c.findOne({ token })) as TokenDocument;

        if (doc?.expires) {
          if (doc.expires < new Date()) {
            // this token exists but has expired, delete it
            await this.deleteAuthToken(token);
          } else if (finalize) {
            // this hasn't expired, but isn't finalized, and we want to finalize it
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
    return this.getCollection<TokenDocument>(COLLECTION).then(async (c) => {
      await c.deleteOne({ token });
    });
  }

  /**
   * Finalizes a temporary auth-token, removing its expiration date
   * @param token
   */
  public static finalizeAuthToken(token: string): Promise<void> {
    return this.getCollection<TokenDocument>(COLLECTION).then(async (c) => {
      await c.updateOne(
        { token, expires: { $exists: true } },
        { $unset: { expires: '' } }
      );
    });
  }
}
