/**
 * @ignore
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

import url from 'fast-url-parser';
import globject from 'globject';
import slasher from 'glob-slasher';
import isEmpty from 'lodash.isempty';
import {
    KEY_SURROGATE_CONTROL
} from './headerTypes';
import { generateAllCacheHeaders } from './cacheControl';
import { isNumberLike, isNonEmptyObject } from './utils';

export * from './headerTypes';
export * from './timeValues';

/**
 * This will either set a specific header or defer to using express' res.set() functionality
 * {{@link http://expressjs.com/en/api.html#res.set}}
 * @param {object} res The current response object
 * @param {object} headerData
 * @param {string} [headerData.name] The response header to use
 * @param {string} [headerData.value] The corresponding response header value
 */
function setHeader(res, headerData) {
    if (headerData.name && headerData.value) {
        res.set(headerData.name, headerData.value);
    } else if (isNonEmptyObject(headerData)) {
        res.set(headerData);
    }
}

/**
 * @param {object<array>} headers
 * @param {string} headers[].name The header name
 * @param {string} headers[].value The header value
 * @returns {function(*, *=, *)}
 */
export function setAdditionalHeaders(headers = []) {
    return (req, res, next) => {
        if (Array.isArray(headers) && headers.length) {
            headers.map(headerData => setHeader(res, headerData));
        }
        next();
    };
}

/**
 * {{@link module:cacheControl#generate}} for acceptable values
 * @memberof index
 * @param {object} [config]
 * @param {object} [config.cacheSettings=undefined] Cache settings to override the default `paths` settings
 * @param {object} [config.paths] Cache settings with glob path patterns
 * @return {Function}
 */
export function middleware(config) {

    const { cacheSettings, paths } = config || {};

    return (req, res, next) => {

        const pathname = url.parse(req.originalUrl).pathname;
        const cacheValues = globject(slasher(paths || {}, {value: false}));
        let values = cacheValues(slasher(pathname));

        if (isNonEmptyObject(cacheSettings)) {
            // override default cacheValue settings
            values = generateAllCacheHeaders(cacheSettings);
        } else if (isNonEmptyObject(values)) {
            values = generateAllCacheHeaders(values);
        } else if (values === false) {
            values = generateAllCacheHeaders({
                [KEY_SURROGATE_CONTROL]: 0,
                setPrivate: true
            });
        } else if (isNumberLike(values)) {
            // catch `0` before !cacheValue check
            // make sure to convert value to actual number
            values = generateAllCacheHeaders({ [KEY_SURROGATE_CONTROL]: Number(values) });
        } else if (isEmpty(values)) {
            values = generateAllCacheHeaders();
        }

        setHeader(res, values);

        next();
    };
}
