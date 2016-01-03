/**
 * @ignore
 * User: daletan
 * Date: 12/19/15
 * Time: 10:23 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const utils = require('./utils');
const timeValues = require('./timeValues');
/**
 * @memberof module:cacheControl
 * @type {Object}
 */
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

/**
 * If a number or number-like, return the value as a number
 * If a string, and it is in a the `timeValues` map, return that time value
 * @private
 * @param {number|string} value
 * @return {number|string}
 */
function getTimeValue(value) {
    if (utils.isNumberLike(value)) {
        value = Number(value);
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
 * All options can use a string value. See {@link module:timeValues} for all available values
 * @memberof module:cacheControl
 * @alias generate
 * @param {object} [options] Caching options
 * @param {number|string} [options.maxAge=timeValues.TEN_MINUTES] The browser cache length
 * @param {number|string} [options.sMaxAge=false] The cdn cache length
 * @param {number|string} [options.staleRevalidate=false] Time when to refresh the content in the background
 * @param {number|string} [options.staleError=false] Time to allow for serving cache when there is an error from a back-end service
 * @return {{name: string, value: string}}
 */
function generateCacheControl(options) {

    const { maxAge = timeValues.TEN_MINUTES,
        sMaxAge = false,
        staleRevalidate = false,
        staleError = false,
        setNoCache = false,
        // private should only be used for user-specific pages. ie account pages
        // This will not be set if the sMaxAge is set
        setPrivate = false } = options || {};
    let cacheHeaders;

    if (setNoCache) {
        cacheHeaders = ['no-cache', generateBrowserCacheHeader(0)];
    } else {
        cacheHeaders = [generateBrowserCacheHeader(maxAge)];

        if (sMaxAge) {
            cacheHeaders.push(generateCdnCacheHeader(sMaxAge));
        }

        if (staleRevalidate) {
            cacheHeaders.push(generateStaleRevalidateCacheHeader(staleRevalidate));
        }

        if (staleError) {
            cacheHeaders.push(generateStaleError(staleError));
        }
    }

    if (setPrivate && !sMaxAge) {
        cacheHeaders.unshift('private');
    }

    return {
        name: 'Cache-Control',
        value: `${cacheHeaders.join(', ')}`
    };
}

/**
 * @module cacheControl
 * @type {{generate: generateCacheControl, headerTypes: Object}}
 */
module.exports = {
    generate: generateCacheControl,
    headerTypes
};
