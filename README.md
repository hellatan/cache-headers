# Cache Headers

Create cache headers as application-level or route-level middleware. This has only been tested as middleware for an express app.
The primary cache header set is the `Cache-Control` header value. All time values are set as seconds per the [w3 spec][spec].

This package is developed using [ES6][es6-moz] and transpiled with [babel]. It is also using the [1stdibs eslint rules][eslint-rules].

## Installation

```sh
$ yarn add cache-headers
// with npm 
$ npm install --save cache-headers
```

## Tests
```sh
$ yarn
$ yarn test
// with npm
$ npm install
$ npm test
```

## Usage

### App-level middleware

```es6
const express = require('express');
const app = express();
const cache = require('cache-headers');
const cacheOptions = {
    paths: {
        '/**/generic': {
            maxAge: 'TEN_MINUTES',
            staleRevalidate: 'ONE_HOUR',
            staleError: 'ONE_HOUR'
        },
        '/short-cached/route': {
            maxAge: 60
        },
        '/user/route': false,
        '/**': {
            maxAge: 600
        }
    }
};

// some other middleware

app.use(cache.middleware(cacheOptions));

// rest of app setup
```

With the example above, the `Cache-Control` header is set as follows when a user hits these different site routes:
- `/**/generic` (any route ending in `generic`): `Cache-Control: max-age=600, stale-while-revalidate=3600, stale-if-error=3600`
- `/cached/route`: `Cache-Control: max-age=60`
- `/user/route`: `Cache-Control: no-cache, max-age=0`
- `/**` (any other route not listed): `Cache-Control: max-age=600`

### Router-level middleware

Taking the app-level setup above, you can additionally override the default `paths` initially set in the `cacheOptions`.

```es6
const express = require('express');
const router = express.Router();
const cache = require('cache-headers');
const cacheOptions = {
    cacheSettings: {
        "maxAge": 2000
    }
};

// app.use(cache.middleware(cacheOptions)) is loaded prior to this route, therefore running by default
// and any subsequent call to set the header is then overwritten

router.get('/endswith/generic', cache.middleware(cacheOptions), (req, res, next) => {
    // do route-y stuff
    next();
});

```

Rather than set the original headers defined in the `paths` config in the app-level setup (for the `/**/generic` path), this will output the following: `Cache-Control: max-age=2000`

## API

### cache.middleware (all properties optional)
```js
{
    cacheSettings: {
        maxAge: number|string,
        staleRevalidate: number|string,
        staleError: number|string
    },
    paths: {
        '/glob/**/path': object|boolean=false
    }
}
```

The following are acceptable values to use if a string is passed in for cache values:

- `'ONE_MINUTE'`
- `'TEN_MINUTES'`
- `'ONE_HOUR'`
- `'ONE_DAY'`
- `'ONE_WEEK'`
- `'ONE_MONTH'`
- `'ONE_YEAR'`

If no options are passed in, the default value set is `Cache-Control: max-age=600`

## Contributing
All code additions and bugfixes must be accompanied by unit tests. Tests are run with jest and
written with the node [`assert`][assert] module.

## Acknowledgement
A portion of this code was taken from this [cache-control][cache-control] package/repo.

[eslint-rules]: https://github.com/1stdibs/eslint-config-1stdibs
[babel]: https://babeljs.io/
[es6-moz]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/ECMAScript_6_support_in_Mozilla
[spec]: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9.3
[cache-control]: https://github.com/divshot/cache-control
[assert]: https://nodejs.org/api/assert.html
