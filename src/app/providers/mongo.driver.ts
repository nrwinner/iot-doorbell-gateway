// deno-lint-ignore-file no-async-promise-executor

// FIXME(nrwinner) we shouldn't be reaching so deeply into the src directory for this, but it's
// a limitation of current deno_mongo library. Fix in future if `Database` is directly exported
import { Database } from 'https://deno.land/x/mongo@v0.21.0/src/database.ts';
import { Collection } from 'https://deno.land/x/mongo@v0.21.0/src/collection/collection.ts';
import { MongoClient } from 'https://deno.land/x/mongo@v0.21.0/mod.ts';

class MongoConnection {
  private static instance: MongoConnection;

  private constructor() {
    this._db = this.connect();
  }

  public static g() {
    if (!this.instance) {
      this.instance = new MongoConnection();
    }

    return this.instance;
  }

  private _db: Promise<Database>;
  private connected = false;

  public get db() {
    return this._db;
  }

  private connect(): Promise<Database> {
    const dbHost = Deno.env.get('DATABASE_HOST');
    const dbName = Deno.env.get('DATABASE_NAME');
    const dbUser = Deno.env.get('DATABASE_USERNAME');
    const dbPass = Deno.env.get('DATABASE_PASSWORD');

    if (!dbHost || !dbName || !dbUser || !dbPass) {
      return Promise.reject('database credentials unavailable');
    }

    // FIXME(nrwinner) don't use an async function inside promise body here
    return new Promise<Database>(async (resolve, reject) => {
      const client = new MongoClient();
      let retryCount = 0;
      const totalRetries = 5;

      while (!this.connected && retryCount++ < totalRetries) {
        // FIXME(nrwinner) this is the only way to connect to atlas from the deno_mongo library atm, fix when improved
        await client
          .connect({
            db: dbName,
            tls: true,
            servers: [
              {
                host: dbHost,
                port: 27017,
              },
            ],
            credential: {
              username: dbUser,
              password: dbPass,
              db: dbName,
              mechanism: 'SCRAM-SHA-1',
            },
          })
          .then((db: Database) => {
            this.connected = true;
            console.log('connection established');

            // FIXME(nrwinner) remove this abhorrent hack when deno_mongo supports atlas
            // As of right now, the { noCursorTimeout } option must be true in findOne
            // deno_mongo doesn't support this option, and it's sloppy to need to pass this everywhere
            // so we wrap the findOne function with another function that will automatically supply that param
            const originalDb = db.collection;
            db.collection = function <T>(
              collectionName: string
            ): Collection<T> {
              const collection = originalDb.apply(this, [
                collectionName,
              ]) as Collection<T>;

              const original = collection.findOne;
              collection.findOne = function (query: any, options: any) {
                return original.apply(this, [
                  query,
                  Object.assign({}, options, { noCursorTimeout: false }),
                ]);
              };

              return collection;
            };

            resolve(db);
          })
          .catch((err: Error) => {
            this.connected = false;
            console.error('error during connection attempt:', err);
          });
      }

      if (!this.connected) {
        reject('could not connect to mongo, all attempts failed');
      }
    });
  }
}

export abstract class MongoDriver {
  private static connection = MongoConnection.g();

  protected static collection: string;

  protected static getCollection<T>(name: string): Promise<Collection<T>> {
    if (!this.connection.db) {
      throw new Error('db connection could not be established');
    }

    return this.connection.db.then((db) => {
      return db.collection<T>(name);
    });
  }
}
