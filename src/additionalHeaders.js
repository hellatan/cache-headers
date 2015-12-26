/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const moment = require('moment');
const utils = require('./utils');

/**
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
    const value = utils.format(newTime.toISOString(), formatType);

    return {
        name: 'Expires',
        value: value
    };
}

/**
 * @param {string} lastModified
 * @return string
 */
function generateLastModifiedHeader(options = {}) {
    const { date, formatType } = options;
    const value = utils.format(date, formatType);

    return {
        name: 'Last-Modified',
        value: value
    };
}

module.exports = {
    generateExpiresHeader,
    generateLastModifiedHeader
};
