/**
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var utils = require('./utils');

/**
 * @param {object} options
 * @param {number} [options.maxAge] Additional time to add
 * @param {object} [options.testDate] A test date object
 * @param {string} [options.formatType] @see module:utils#format
 * @return string
 */
function generateExpiresHeader() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var maxAge = options.maxAge;
    var testDate = options.testDate;
    var formatType = options.formatType;

    var utcTime = utils.getUtcTime(testDate);
    var newTime = utcTime.add(maxAge);
    var value = utils.formatDate(newTime.toISOString(), formatType);

    return {
        name: 'Expires',
        value: value
    };
}

/**
 * @param {string} lastModified
 * @return string
 */
function generateLastModifiedHeader() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var date = options.date;
    var formatType = options.formatType;

    var value = utils.formatDate(date, formatType);

    return {
        name: 'Last-Modified',
        value: value
    };
}

module.exports = {
    generateExpiresHeader: generateExpiresHeader,
    generateLastModifiedHeader: generateLastModifiedHeader
};