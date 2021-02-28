import { MongoClient } from 'https://deno.land/x/mongo@v0.21.0/mod.ts';

export enum DEP {
  MONGO,
}

const fetchers: { [key: number]: () => Promise<any> } = {
  [DEP.MONGO]: () => {
    const dbHost = Deno.env.get('DATABASE_HOST');
    const dbName = Deno.env.get('DATABASE_NAME');
    const dbUser = Deno.env.get('DATABASE_USERNAME');
    const dbPass = Deno.env.get('DATABASE_PASSWORD');

    if (!dbHost || !dbName || !dbUser || !dbPass) {
      return Promise.reject('database credentials unavailable');
    }

    // FIXME(nrwinner) this is the only way to connect to atlas from the deno_mongo library atm, fix when improved
    const client = new MongoClient();
    return client
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
      .catch((err) => {
        console.error(err);
      });
  },
};

export class Deps {
  private static instance: Deps;

  private deps: Map<DEP, any> = new Map();
  private queued: Map<DEP, Promise<any>> = new Map();

  private constructor() {}

  public static get _(): Deps {
    if (!this.instance) {
      this.instance = new Deps();
    }

    return this.instance;
  }

  public get(d: DEP) {
    if (this.deps.has(d)) {
      // this dependency already exists, resolve the request
      return Promise.resolve(this.deps.get(d));
    } else if (!this.queued.has(d)) {
      // this dependency has not been requested yet, queue it
      const p = new Promise((resolve, reject) => {
        if (!fetchers[d]) {
          reject('no fetcher specified for dependency: ' + d);
        }

        fetchers[d]()
          .then((dep) => this.deps.set(d, dep))
          .finally(() => {
            if (this.deps.has(d)) {
              // resolve any queued requests
              resolve(this.deps.get(d));
            } else {
              // reject any queued requests
              reject('unable to resolve dependency: ' + d);
            }

            if (this.queued.has(d)) {
              // santiy check, this should always pass
              this.queued.delete(d);
            }
          });
      });

      this.queued.set(d, p);
    }

    // return the queued Promise of the dependency
    return this.queued.get(d);
  }
}
