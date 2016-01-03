/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var url = require('fast-url-parser');
var globject = require('globject');
var slasher = require('glob-slasher');
var isEmpty = require('lodash.isempty');
var cacheControl = require('./cacheControl');

var _require = require('./additionalHeaders');

var generateExpiresHeader = _require.generateExpiresHeader;
var generateLastModifiedHeader = _require.generateLastModifiedHeader;

var utils = require('./utils');
var timeValues = require('./timeValues');

function setHeader(res, headerData) {
    res.setHeader(headerData.name, headerData.value);
}

/**
 * @param {object} [config]
 * @param {object} [config.cacheSettings=undefined] Cache settings to override the default `paths` settings
 * @see module:cacheControl#generate for acceptable values
 * @param {object} [config.paths] Cache settings with glob path patterns
 * @returns {Function}
 */
function middleware(config) {
    var _ref = config || {};

    var cacheSettings = _ref.cacheSettings;
    var paths = _ref.paths;

    return function (req, res, next) {

        var pathname = url.parse(req.originalUrl).pathname;
        var cacheValues = globject(slasher(paths || {}, { value: false }));
        var cacheValue = cacheValues(slasher(pathname));

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
            cacheValue = Number(cacheValue);
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
    setHeader: setHeader,
    middleware: middleware,
    timeValues: timeValues,
    generateExpiresHeader: generateExpiresHeader,
    generateLastModifiedHeader: generateLastModifiedHeader
};