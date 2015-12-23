/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const onHeaders = require('on-headers');
const cacheControl = require('./cacheControl');
const additionalHeaders = require('./additionalHeaders');
const utils = require('./utils');
const timeValues = require('./timeValues');

function middleware(config) {
    return (req, res, next) => {
        onHeaders(res, () => {
            if (config) {
                const cache = cacheControl.generate(config);
                res.setHeader(cache.headerName, cache.headerValue);
            }
        });
        next();
    };
}

module.exports = {
    headerTypes: cacheControl.headerTypes,
    middleware,
    timeValues
};
