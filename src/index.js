/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const url = require('fast-url-parser');
const globject = require('globject');
const slasher = require('glob-slasher');
const isEmpty = require('lodash.isempty');
const cacheControl = require('./cacheControl');
const { generateExpiresHeader, generateLastModifiedHeader } = require('./additionalHeaders');
const utils = require('./utils');
const timeValues = require('./timeValues');

function setHeader(res, headerData) {
    res.setHeader(headerData.name, headerData.value);
}

function middleware(config) {

    const { cacheSettings, paths } = config;

    return (req, res, next) => {

        const pathname = url.parse(req.originalUrl).pathname;
        const cacheValues = globject(slasher(paths || {}, {value: false}));
        let cacheValue = cacheValues(slasher(pathname));

        if (utils.isTrueObject(cacheSettings)) {
            // override default cacheValue settings
            cacheValue = cacheControl.generate(cacheSettings).value;
        } else if (utils.isTrueObject(cacheValue)) {
            cacheValue = cacheControl.generate(cacheValue).value;
        } else if (cacheValue === false) {
            cacheValue = cacheControl.generate({ maxAge: 0, sMaxAge: 0, setNoCache: true }).value;
        } else if (utils.isNumberLike(cacheValue)) {
            // catch `0` before !cacheValue check
            // make sure to convert value to actual number
            cacheValue = +cacheValue;
            cacheValue = cacheControl.generate({ maxAge: cacheValue, sMaxAge: cacheValue }).value;
        } else if (!cacheValue || isEmpty(cacheValue)) {
            cacheValue = cacheControl.generate().value;
        }
        setHeader(res, { name: 'Cache-Control', value: cacheValue });

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
