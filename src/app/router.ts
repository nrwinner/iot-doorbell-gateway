import { ServerRequestExtended } from './server-request-extended.ts';

interface MatchedRouteDocument {
  matched: string;
  url: string;
  params?: { [key: string]: any };
  query?: { [key: string]: any };
}

export abstract class Router {
  protected routes: {
    [key: string]: { [key: string]: any };
  } = {};

  constructor(protected baseRoute?: string) {}

  public async handle(request: ServerRequestExtended): Promise<boolean> {
    for (const [route, methodMap] of Object.entries(this.routes)) {
      // retrieve handler for requested HTTP method
      const handler = methodMap[request.method];
      if (!handler) {
        // no handler provided for specified method
        return false;
      }

      // attempt to match the route
      const matchDoc = Router.match(this.buildRoute(route), request.url);
      if (matchDoc) {
        // route matched, load the params and query objects into the request and pass to handler
        request.params = matchDoc.params;
        request.query = matchDoc.query;
        await handler(request);
        return true;
      }
    }

    return false;
  }

  private buildRoute(route: string) {
    // FIXME(nrwinner) this is so slow
    return `${this.baseRoute}/${route}`.replace(/\/{2,}/gi, '/');
  }

  private static match(
    testRoute: string,
    requestedUrl: string
  ): MatchedRouteDocument | undefined {
    const testSegments = testRoute.split('/');
    const urlSegments = requestedUrl.split('?')[0].split('/');

    // if segment counts differ between test and url, cannot match, short circuit
    if (testSegments.length !== urlSegments.length) {
      return undefined;
    }

    // zip the arrays and walk and test each segment for matching
    // build key/value of params as we walk
    const params: { [key: string]: any } = {};
    for (let i = 0; i < testSegments.length; i++) {
      const testSegment = testSegments[i];
      const urlSegment = urlSegments[i];

      if (testSegment.startsWith(':')) {
        // this is a route param, don't attempt to match and add to params map
        params[testSegment.substring(1)] = urlSegment;
        continue;
      }

      if (testSegment !== urlSegment) {
        // segment didn't match, short circuit
        return undefined;
      }
    }

    // going to return true at this point
    // parse query parameters
    const query: { [key: string]: string | number | boolean } = {};
    if (requestedUrl.includes('?')) {
      const queryStringSegments = requestedUrl.split('?')[1].split('&');

      for (const item of queryStringSegments) {
        const [key, value] = item.split('=');

        // handle case of ?key, should evaluate to boolean
        if (value === undefined) {
          query[key] = true;
          continue;
        }

        // handle case of stringified boolean
        if (value === 'true' || value === 'false') {
          query[key] = value === 'true';
          continue;
        }

        // handle case of stringified number
        const num = parseFloat(value);
        if (!isNaN(num)) {
          query[key] = num;
          continue;
        }

        // assume string value
        query[key] = value;
      }
    }

    return { matched: testRoute, url: requestedUrl, query, params };
  }
}
