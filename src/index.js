/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const onHeaders = require('on-headers');
const url = require('fast-url-parser');
const globject = require('globject');
const slasher = require('glob-slasher');
const isEmpty = require('lodash.isempty');
const cacheControl = require('./cacheControl');
const { generateExpiresHeader, generateLastModifiedHeader } = require('./additionalHeaders');
const utils = require('./utils');
const timeValues = require('./timeValues');

function isTrueObject(obj) {
    return !Array.isArray(obj) && typeof obj === 'object';
}

function middleware(config) {
    return (req, res, next) => {

        const { cacheSettings, paths } = config;
        const pathname = url.parse(req.url).pathname;
        const cacheValues = globject(slasher(paths || {}, {value: false}));
        let cacheValue = cacheValues(slasher(pathname));

        onHeaders(res, () => {
            if (!isEmpty(cacheSettings) && isTrueObject(cacheSettings)) {
                // override default cacheValue settings
                cacheValue = cacheControl.generate(cacheSettings).headerValue;
            } else if (!cacheValue) {
                cacheValue = cacheControl.generate().headerValue;
            }
            res.setHeader('Cache-Control', cacheValue);
        });
        next();
    };
}

module.exports = {
    headerTypes: cacheControl.headerTypes,
    middleware,
    timeValues,
    generateExpiresHeader,
    generateLastModifiedHeader
};
