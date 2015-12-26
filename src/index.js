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
const regular = require('regular');
const isNumber = require('lodash.isnumber');
const isEmpty = require('lodash.isempty');
const cacheControl = require('./cacheControl');
const { generateExpiresHeader, generateLastModifiedHeader } = require('./additionalHeaders');
const utils = require('./utils');
const timeValues = require('./timeValues');

function isTrueObject(obj) {
    return !Array.isArray(obj) && typeof obj === 'object' && !isEmpty(obj) ;
}

function isNumberLike(val) {
    return isNumber(val) || regular.number.test(val);
}

function setHeader(res, headerData) {
    res.setHeader(headerData.name, headerData.value);
}

function middleware(config) {
    return (req, res, next) => {

        const { cacheSettings, paths } = config;
        const pathname = url.parse(req.url).pathname;
        const cacheValues = globject(slasher(paths || {}, {value: false}));
        let cacheValue = cacheValues(slasher(pathname));

        onHeaders(res, () => {
            console.log('cache: ', cacheValue, ' :: ', config);
            if (isTrueObject(cacheSettings)) {
                // override default cacheValue settings
                cacheValue = cacheControl.generate(cacheSettings).value;
            } else if (isTrueObject(cacheValue)) {
                cacheValue = cacheControl.generate(cacheValue).value;
            } else if (cacheValue === false) {
                cacheValue = cacheControl.generate({ maxAge: 0, sMaxAge: 0, setNoCache: true }).value;
            } else if (isNumberLike(cacheValue)) {
                // catch `0` before !cacheValue check
                // make sure to convert value to actual number
                cacheValue = +cacheValue;
                cacheValue = cacheControl.generate({ maxAge: cacheValue, sMaxAge: cacheValue }).value;
            } else if (!cacheValue || isEmpty(cacheValue)) {
                cacheValue = cacheControl.generate().value;
            }
            setHeader(res, { name: 'Cache-Control', value: cacheValue });
        });
        next();
    };
}

module.exports = {
    headerTypes: cacheControl.headerTypes,
    setHeader,
    middleware,
    timeValues,
    generateExpiresHeader,
    generateLastModifiedHeader
};
