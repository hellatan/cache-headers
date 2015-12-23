/**
 * User: daletan
 * Date: 12/24/15
 * Time: 9:51 AM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

// time set in seconds
const ONE_MINUTE = 60;
const TEN_MINUTES = ONE_MINUTE * 10;
const ONE_HOUR = TEN_MINUTES * 6;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;
const ONE_MONTH = ONE_DAY * 30;

/**
 * @module timeValues
 * @type {Object}
 */
module.exports = Object.freeze({
    ONE_MINUTE,
    TEN_MINUTES,
    ONE_HOUR,
    ONE_DAY,
    ONE_WEEK,
    ONE_MONTH
});
