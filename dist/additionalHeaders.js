/**
 * @ignore
 * User: daletan
 * Date: 12/19/15
 * Time: 8:49 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var utils = require('./utils');

/**
 * @memberof additionalHeaders
 * @param {object} options
 * @param {number} [options.maxAge] Additional time to add
 * @param {object} [options.testDate] A test date object
 * @param {string} [options.formatType] {@link module:utils#formatDate}
 * @return {{ name: string, value: string }}
 */
function generateExpiresHeader() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var maxAge = options.maxAge;
    var testDate = options.testDate;
    var formatType = options.formatType;

    var newTime = utils.addTime({ date: testDate, timeToAdd: maxAge });
    var value = utils.formatDate(newTime.toISOString(), formatType);

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
 * @return {{ name: string, value: string }}
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

/**
 * @module additionalHeaders
 * @type {{generateExpiresHeader: generateExpiresHeader, generateLastModifiedHeader: generateLastModifiedHeader}}
 */
module.exports = {
    expires: generateExpiresHeader,
    lastModified: generateLastModifiedHeader
};