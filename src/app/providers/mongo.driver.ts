import { Deps, DEP } from '../../deps.ts';

// FIXME(nrwinner) we shouldn't be reaching so deeply into the src directory for this, but it's
// a limitation of current deno_mongo library. Fix in future if `Database` is directly exported
import { Database } from 'https://deno.land/x/mongo@v0.21.0/src/database.ts';
import { Collection } from 'https://deno.land/x/mongo@v0.21.0/src/collection/collection.ts';

export abstract class MongoDriver {
  private static db: Promise<Database> | undefined = Deps._.get(DEP.MONGO);

  protected static collection: string;

  protected static getCollection<T>(name: string): Promise<Collection<T>> {
    if (!this.db) {
      throw new Error('db not available');
    } else {
      return this.db.then((db) => {
        return db.collection<T>(name);
      });
    }
  }
}
