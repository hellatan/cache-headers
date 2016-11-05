/**
 * @ignore
 * User: daletan
 * Date: 12/22/15
 * Time: 7:26 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

import assert from 'assert';
import * as timeValues from '../src/timeValues';
import { formatDate } from '../src/utils';
import {headerTypes, generateAllCacheHeaders, NO_CACHE_NO_STORE} from '../src/cacheControl';

const now = formatDate(new Date('2001-01-01'));
const CACHE_CONTROL_STR = 'Cache-Control';
const SURROGATE_CONTROL_STR = 'Surrogate-Control';

const staticHeaders = {
    Expires: 0,
    Pragma: 'no-cache',
    'Last-Modified': now
};

// default this value, can use in Object.assign if necessary
const lastModifiedHeader = {
    lastModified: now
};

describe('cache control', function () {

    function createOptions(options) {
        return Object.assign({}, options, lastModifiedHeader);
    }

    function headerAssertions(actual, expect) {
        expect = Object.assign({}, staticHeaders, expect);
        assert.deepEqual(actual, expect);
    }

    it('should set correct default cache control headers', function () {
        const actual = generateAllCacheHeaders(lastModifiedHeader);
        const expect = {
            [CACHE_CONTROL_STR]: NO_CACHE_NO_STORE,
            [SURROGATE_CONTROL_STR]: 'max-age=600'
        };
        headerAssertions(actual, expect);
    });
    it('should set all headers passed in along with default max-age header not passed in', function () {
        const staleRevalidate = 200;
        const staleError = 300;
        const actual = generateAllCacheHeaders(createOptions({
            staleRevalidate,
            staleError
        }));
        const expect = {
            [CACHE_CONTROL_STR]: `${NO_CACHE_NO_STORE}, stale-while-revalidate=200, stale-if-error=300`,
            [SURROGATE_CONTROL_STR]: 'max-age=600'
        };
        headerAssertions(actual, expect);
    });
    it('should set all headers passed in defined with string keywords and numbers', function () {
        const actual = generateAllCacheHeaders(createOptions({
            [headerTypes.staleRevalidate]: 'ONE_MINUTE',
            [headerTypes.staleError]: 10
        }));
        const expect = {
            [CACHE_CONTROL_STR]: `${NO_CACHE_NO_STORE}, stale-while-revalidate=60, stale-if-error=10`,
            [SURROGATE_CONTROL_STR]: 'max-age=600'
        };
        headerAssertions(actual, expect);
    });
    it('should add `private` cache-control and set surrogate-control max-age to 0 when set to private', function () {
        const actual = generateAllCacheHeaders(createOptions({
            setPrivate: true,
            [headerTypes.surrogateControl]: timeValues.ONE_DAY
        }));
        const expect = {
            [CACHE_CONTROL_STR]: `private, ${NO_CACHE_NO_STORE}`,
            [SURROGATE_CONTROL_STR]: 'max-age=0'
        };
        headerAssertions(actual, expect);
    });
    it('should properly case the string value and return the correct time', function () {
        const actual = generateAllCacheHeaders(createOptions({
            [headerTypes.staleRevalidate]: 'one_minute',
            [headerTypes.staleError]: 'one_week'
        }));
        const expect = {
            [CACHE_CONTROL_STR]: `${NO_CACHE_NO_STORE}, stale-while-revalidate=60, stale-if-error=604800`,
            [SURROGATE_CONTROL_STR]: 'max-age=600'
        };
        headerAssertions(actual, expect);
    });
    describe('setting time values', function () {
        const times = ['ONE_MINUTE', 'TEN_MINUTES', 'HALF_HOUR',
            'ONE_HOUR', 'ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR',
            'INVALID', false, 0];

        function createExpect(time) {
            if (time === 'INVALID' || time === false || time === 0) {
                time = 0;
            } else {
                time = timeValues[time];
            }
            return Object.assign({},
                staticHeaders,
                {
                    [CACHE_CONTROL_STR]: NO_CACHE_NO_STORE,
                    [SURROGATE_CONTROL_STR]: `max-age=${time}`
                }
            );
        }

        times.forEach(function (time) {
            it(`should correctly set the time value for ${time}`, function () {
                const options = createOptions.call(null, {
                    [headerTypes.surrogateControl]: time
                });
                const actual = generateAllCacheHeaders.call(null, options);
                const expect = createExpect.call(null, time);
                headerAssertions(actual, expect);
            });
        });
    });
});
