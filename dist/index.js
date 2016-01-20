/**
 * @ignore
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

var _require = require('./cacheControl');

var headerTypes = _require.headerTypes;
var generate = _require.generate;

var additionalHeaders = require('./additionalHeaders');
var utils = require('./utils');
var timeValues = require('./timeValues');

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
        res.setHeader(headerData.name, headerData.value);
    } else if (utils.isTrueObject(headerData)) {
        res.set(headerData);
    }
}

function setAdditionalHeaders() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return function (req, res, next) {
        Object.keys(options).forEach(function (key) {
            if (typeof additionalHeaders[key] === 'function') {
                var option = options[key];
                var headerData = additionalHeaders[key](option);
                setHeader(res, headerData);
            }
        });
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
    headerTypes: headerTypes,
    setAdditionalHeaders: setAdditionalHeaders,
    middleware: middleware
}, timeValues);