/**
 * User: daletan
 * Date: 12/22/15
 * Time: 7:26 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const assert = require('assert');
const cacheControl = require('../src/cacheControl');
const { headerTypes } = cacheControl;

const CACHE_CONTROL_STR = 'Cache-Control';

describe('cache control', () => {
    it('should set correct default cache control headers', () => {
        const actual = cacheControl.generate();
        assert.deepEqual(actual, { name: CACHE_CONTROL_STR, value: 'max-age=600' });
    });
    it('should set all headers passed in along with default max-age header not passed in', () => {
        const sMaxAge = 100;
        const staleRevalidate = 200;
        const staleError = 300;
        const actual = cacheControl.generate({
            sMaxAge,
            staleRevalidate,
            staleError
        });
        const expect = {
            name: CACHE_CONTROL_STR,
            value: 'max-age=600, s-maxage=100, stale-while-revalidate=200, stale-if-error=300'
        };
        assert.deepEqual(actual, expect);
    });
    it('should set all headers passed in defined with string keywords', () => {
        const actual = cacheControl.generate({
            [headerTypes.browser.varName]: 'ONE_HOUR',
            [headerTypes.cdn.varName]: 'ONE_WEEK',
            [headerTypes.staleRevalidate.varName]: 'ONE_MINUTE',
            [headerTypes.staleError.varName]: 10
        });
        const expect = {
            name: CACHE_CONTROL_STR,
            value: 'max-age=3600, s-maxage=604800, stale-while-revalidate=60, stale-if-error=10'
        };
        assert.deepEqual(actual, expect);
    });
    it('should default to 10 when an invalid string value is passed in', () => {
        const actual = cacheControl.generate({
            [headerTypes.browser.varName]: 'INVALID_TIME'
        });
        const expect = {
            name: CACHE_CONTROL_STR,
            value: 'max-age=10'
        };
        assert.deepEqual(actual, expect);
    });
    it('should properly case the string value and return the correct time', () => {
        const actual = cacheControl.generate({
            [headerTypes.browser.varName]: 'one_minute',
            [headerTypes.cdn.varName]: 'one_week'
        });
        const expect = {
            name: CACHE_CONTROL_STR,
            value: 'max-age=60, s-maxage=604800'
        };
        assert.deepEqual(actual, expect);

    });
    it('should set no-cache header and ignore even valid cache headers', () => {
        const actual = cacheControl.generate({
            setNoCache: true,
            [headerTypes.browser.varName]: 'one_minute',
            [headerTypes.cdn.varName]: 'one_week'
        });
        const expect = {
            name: CACHE_CONTROL_STR,
            value: 'no-cache, max-age=0'
        };
        assert.deepEqual(actual, expect);
    });

    describe('"private"', () => {
        it('should set the header along with "private"', () => {
            const actual = cacheControl.generate({
                setPrivate: true,
                [headerTypes.browser.varName]: 'ten_minutes'
            });
            const expect = {
                name: CACHE_CONTROL_STR,
                value: 'private, max-age=600'
            };
            assert.deepEqual(actual, expect);
        });
        it('should not set the "private" cache when s-maxage is passed in', () => {
            const actual = cacheControl.generate({
                setPrivate: true,
                [headerTypes.browser.varName]: 'ten_minutes',
                [headerTypes.cdn.varName]: 'one_week'
            });
            const expect = {
                name: CACHE_CONTROL_STR,
                value: 'max-age=600, s-maxage=604800'
            };
            assert.deepEqual(actual, expect);
        });
    });

});
