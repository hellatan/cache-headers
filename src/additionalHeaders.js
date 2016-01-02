/**
 * @ignore
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const utils = require('./utils');

/**
 * @memberOf additionalHeaders
 * @param {object} options
 * @param {number} [options.maxAge] Additional time to add
 * @param {object} [options.testDate] A test date object
 * @param {string} [options.formatType] @see module:utils#format
 * @return string
 */
function generateExpiresHeader(options = {}) {
    const { maxAge, testDate, formatType } = options;
    const utcTime = utils.getUtcTime(testDate);
    const newTime = utcTime.add(maxAge);
    const value = utils.formatDate(newTime.toISOString(), formatType);

    return {
        name: 'Expires',
        value: value
    };
}

/**
 * @memberof additionalHeaders
 * @alias module:additionalHeaders.generateLastModifiedHeader
 * @param {string} options
 * @param {object} options.date
 * @param {string} [options.formatType]
 * @return string
 */
function generateLastModifiedHeader(options = {}) {
    const { date, formatType } = options;
    const value = utils.formatDate(date, formatType);

    return {
        name: 'Last-Modified',
        value: value
    };
}

/**
 * @module additionalHeaders
 * @type {{generateExpiresHeader: generateExpiresHeader, generateLastModifiedHeader: generateLastModifiedHeader}}
 */
module.exports = {
    generateExpiresHeader,
    generateLastModifiedHeader
};
