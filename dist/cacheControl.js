/**
 * User: daletan
 * Date: 12/19/15
 * Time: 10:23 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var utils = require('./utils');
var timeValues = require('./timeValues');
var headerTypes = Object.freeze({
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
 * @param {number|string} value
 * @returns {*}
 */
function getTimeValue(value) {
    if (utils.isNumberLike(value)) {
        value = Number(value);
    } else if (typeof value === 'string') {
        value = value.toUpperCase();
        if (!timeValues[value]) {
            console.warn('An invalid time value was passed in, received \'' + value + '\'. Returning a value of 10');
            return 10;
        }
        return timeValues[value];
    }
    return value;
}

function generateBrowserCacheHeader(maxAge) {
    return headerTypes.browser.value + '=' + getTimeValue(maxAge);
}

function generateCdnCacheHeader(maxAge) {
    return headerTypes.cdn.value + '=' + getTimeValue(maxAge);
}

function generateStaleRevalidateCacheHeader(maxAge) {
    return headerTypes.staleRevalidate.value + '=' + getTimeValue(maxAge);
}

function generateStaleError(maxAge) {
    return headerTypes.staleError.value + '=' + getTimeValue(maxAge);
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
    var _ref = options || {};

    var _ref$maxAge = _ref.maxAge;
    var maxAge = _ref$maxAge === undefined ? timeValues.TEN_MINUTES : _ref$maxAge;
    var _ref$sMaxAge = _ref.sMaxAge;
    var sMaxAge = _ref$sMaxAge === undefined ? false : _ref$sMaxAge;
    var _ref$staleRevalidate = _ref.staleRevalidate;
    var staleRevalidate = _ref$staleRevalidate === undefined ? false : _ref$staleRevalidate;
    var _ref$staleError = _ref.staleError;
    var staleError = _ref$staleError === undefined ? false : _ref$staleError;
    var _ref$setNoCache = _ref.setNoCache;
    var setNoCache = _ref$setNoCache === undefined ? false : _ref$setNoCache;
    var _ref$setPrivate = _ref.setPrivate;
    var
    // private should only be used for user-specific pages. ie account pages
    // This will not be set if the sMaxAge is set
    setPrivate = _ref$setPrivate === undefined ? false : _ref$setPrivate;

    var cacheHeaders = undefined;

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
        value: '' + cacheHeaders.join(', ')
    };
}

/**
 * @module cacheControl
 * @type {{generate: generateCacheControl, headerTypes: Object}}
 */
module.exports = {
    generate: generateCacheControl,
    headerTypes: headerTypes
};