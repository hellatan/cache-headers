/**
 * @ignore
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
const { headerTypes, generate } = require('./cacheControl');
const { generateExpiresHeader, generateLastModifiedHeader } = require('./additionalHeaders');
const utils = require('./utils');
const timeValues = require('./timeValues');

/**
 * @param {object} res The current response object
 * @param {object} headerData
 * @param {string} headerData.name The response header to use
 * @param {string} headerData.value The corresponding response header value
 */
function setHeader(res, headerData) {
    res.setHeader(headerData.name, headerData.value);
}

/**
 * {{@link module:cacheControl#generate}} for acceptable values
 * @memberof index
 * @param {object} [config]
 * @param {object} [config.cacheSettings=undefined] Cache settings to override the default `paths` settings
 * @param {object} [config.paths] Cache settings with glob path patterns
 * @return {Function}
 */
function middleware(config) {

    const { cacheSettings, paths } = config || {};

    return (req, res, next) => {

        const pathname = url.parse(req.originalUrl).pathname;
        const cacheValues = globject(slasher(paths || {}, {value: false}));
        let cacheValue = cacheValues(slasher(pathname));

        if (utils.isTrueObject(cacheSettings)) {
            // override default cacheValue settings
            cacheValue = generate(cacheSettings).value;
        } else if (utils.isTrueObject(cacheValue)) {
            cacheValue = generate(cacheValue).value;
        } else if (cacheValue === false) {
            cacheValue = generate({ maxAge: 0, sMaxAge: 0, setNoCache: true }).value;
        } else if (utils.isNumberLike(cacheValue)) {
            // catch `0` before !cacheValue check
            // make sure to convert value to actual number
            cacheValue = Number(cacheValue);
            cacheValue = generate({ maxAge: cacheValue, sMaxAge: cacheValue }).value;
        } else if (!cacheValue || isEmpty(cacheValue)) {
            cacheValue = generate().value;
        }
        setHeader(res, { name: 'Cache-Control', value: cacheValue });

        next();
    };
}

/**
 * @module index
 * @type {object}
 */
module.exports = Object.assign({
    headerTypes,
    setHeader,
    middleware,
    generateExpiresHeader,
    generateLastModifiedHeader
}, timeValues);
