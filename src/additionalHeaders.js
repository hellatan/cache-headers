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
 * @memberof additionalHeaders
 * @param {object} options
 * @param {number} [options.maxAge] Additional time to add
 * @param {object} [options.date] A test date object
 * @param {string} [options.formatType] {@link module:utils#formatDate}
 * @return {{ name: string, value: string }}
 */
function generateExpiresHeader(options = {}) {
    const { maxAge, date, formatType } = options;
    const newTime = utils.addTime({ date, timeToAdd: maxAge });
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
 * @return {{ name: string, value: string }}
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
    expires: generateExpiresHeader,
    lastModified: generateLastModifiedHeader
};
