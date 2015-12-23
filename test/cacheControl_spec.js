/**
 * User: daletan
 * Date: 12/22/15
 * Time: 7:26 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const assert = require('assert');
const cacheControl = require('../src/cacheControl');

const CACHE_CONTROL_STR = 'Cache-Control';

describe('cache control', () => {
   it('should set correct default cache control headers', () => {
        const actual = cacheControl.generate();
        assert.deepEqual(actual, { headerName: CACHE_CONTROL_STR, headerValue: 'max-age=600' });
   });
   it('should set all headers passed in along with default max-age header not passed in', () => {
       const sMaxAge = 100;
       const staleRevalidate = 200;
       const staleError = 300;
       let actual = cacheControl.generate({
           sMaxAge,
           staleRevalidate,
           staleError
       });
       let expect = {
           headerName: CACHE_CONTROL_STR,
           headerValue: 'max-age=600, s-maxage=100, stale-while-revalidate=200, stale-if-error=300'
       };
       assert.deepEqual(actual, expect);
   });
    it('should set all headers passed in defined with string keywords', () => {
       const headerTypes = cacheControl.headerTypes;
       const actual = cacheControl.generate({
           [headerTypes.browser.varName]: 'ONE_HOUR',
           [headerTypes.cdn.varName]: 'ONE_WEEK',
           [headerTypes.staleRevalidate.varName]: 'ONE_MINUTE',
           [headerTypes.staleError.varName]: 10
       });

       const expect = {
           headerName: CACHE_CONTROL_STR,
           headerValue: 'max-age=3600, s-maxage=604800, stale-while-revalidate=60, stale-if-error=10'
       };

       assert.deepEqual(actual, expect);

   });
});
