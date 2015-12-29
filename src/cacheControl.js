/**
 * User: daletan
 * Date: 12/19/15
 * Time: 10:23 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const utils = require('./utils');
const timeValues = require('./timeValues');
const headerTypes = Object.freeze({
    browser: {
        varName: 'maxAge',
        value: 'max-age'
    },
    cdn: {
        varName: 'sMaxAge',
        value: 's-maxage'
    },
    staleRevalidate: {
        varName: 'staleRevalidate',
        value: 'stale-while-revalidate'
    },
    staleError: {
        varName: 'staleError',
        value: 'stale-if-error'
    }
});

function getTimeValue(value) {
    if (utils.isNumberLike(value)) {
        value = +value;
    } else if (typeof value === 'string') {
        value = value.toUpperCase();
        if (!timeValues[value]) {
            console.warn(`An invalid time value was passed in, received '${value}'. Returning a value of 10`);
            return 10;
        }
        return timeValues[value];
    }
    return value;
}

function generateBrowserCacheHeader(maxAge) {
    return `${headerTypes.browser.value}=${getTimeValue(maxAge)}`;
}

function generateCdnCacheHeader(maxAge) {
    return `${headerTypes.cdn.value}=${getTimeValue(maxAge)}`;
}

function generateStaleRevalidateCacheHeader(maxAge) {
    return `${headerTypes.staleRevalidate.value}=${getTimeValue(maxAge)}`;
}

function generateStaleError(maxAge) {
    return `${headerTypes.staleError.value}=${getTimeValue(maxAge)}`;
}

/**
 * All options can use a string value
 * @see module:timeValue
 * @param {object} [options] Caching options
 * @param {number|string} [options.maxAge] The browser cache length
 * @param {number|string} [options.sMaxAge] The cdn cache length
 * @param {number|string} [options.staleRevalidate]
 * @param {number|string} [options.staleError]
 * @returns {{headerName: string, headerValue: string}}
 */
function generateCacheControl(options) {

    const { maxAge = timeValues.TEN_MINUTES,
        sMaxAge = 0,
        staleRevalidate = 0,
        staleError = 0,
        setNoCache = false } = options || {};
    const cacheHeaders = [generateBrowserCacheHeader(maxAge)];

    if (sMaxAge) {
        cacheHeaders.push(generateCdnCacheHeader(sMaxAge));
    }

    if (staleRevalidate) {
        cacheHeaders.push(generateStaleRevalidateCacheHeader(staleRevalidate));
    }

    if (staleError) {
        cacheHeaders.push(generateStaleError(staleError));
    }

    if (setNoCache) {
        cacheHeaders.push('no-cache');
    }

    return {
        name: 'Cache-Control',
        value: `${cacheHeaders.join(', ')}`
    };
}

module.exports = {
    generate: generateCacheControl,
    headerTypes
};
