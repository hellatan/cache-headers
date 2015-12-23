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
 * @param {number} options.maxAge
 * @param {object} options.testDate A test date object
 * @param {string} options.formatType
 * @return string
 */
function generateExpiresHeader(options = {}) {
    const { maxAge, testDate, formatType } = options;
    const date = testDate || new Date();
    const utcTime = moment.utc(date);
    const newTime = utcTime.add(maxAge);
    const expiresDate = moment.utc(newTime.toISOString());
    const format = utils.dateFormats[formatType || 'normal'];
    const formatted = expiresDate.format(format);

    // Expires: Tue, 22 Dec 2015 14:48:51 GMT
    return `Expires: ${formatted} GMT`;
}

/**
 * @param {string} lastModified
 * @return string
 */
function generateLastModifiedHeader(lastModified) {
    return `Last-Modified: ${lastModified} GMT`;
}

/**
 * @param {number} maxAge
 * @return bool|string
 */
function generatePragmaHeader(maxAge) {
    if (maxAge <= 10) {
        return 'Pragma: no-cache';
    }
    return false;
}

module.exports = {
    generateExpiresHeader,
    generateLastModifiedHeader,
    generatePragmaHeader
};
