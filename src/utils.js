/**
 * @ignore
 * User: daletan
 * Date: 12/19/15
 * Time: 10:25 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

import {now, createUTC as utc} from 'moment/src/lib/moment/moment';
import {getSetGlobalLocale} from 'moment/src/lib/locale/locale';
import {formatMoment} from 'moment/src/lib/format/format';
import regular from 'regular';
import isEmpty from 'lodash.isempty';

// Mon, 01, Jan 2016, 00:00:00 UTC
const defaultDateFormat = 'ddd, DD MMM YYYY HH:mm:ss z';

/**
 * @param {*} val The value to check if it is an actual object. Arrays are not considered objects in this case
 * @return {boolean}
 */
export function isNonEmptyObject(val) {
    return !Array.isArray(val) && typeof val === 'object' && !isEmpty(val);
}

/**
 *
 * @param {*} val The value to check if it is like a number ie. 100 and "100" would return true
 * @return {boolean}
 */
export function isNumberLike(val) {
    return regular.number.test(val);
}

/**
 * @param {object} [time] Date object
 * @return {object} moment object in UTC format
 */
function getUtcTime(time = new Date()) {
    return utc(time);
}

/**
 * Format a UTC Date value
 * @param {object} options
 * @param {number} [options.date=now()] UTC time format. A JavaScript date must be passed in, not a moment date object
 * @param {string} [options.dateFormat=defaultDateFormat] Primarily used for testing
 * @param {string} [options.locale={key: string, config: array}] See http://momentjs.com/docs/#/use-it/typescript/
 * @return {string} header date string in GMT format
 */
export function formatDate(options = {}) {
    const {
        date = now(),
        dateFormat = defaultDateFormat,
        locale = {key: undefined, config: undefined}
    } = options;
    // need to set locale before formatting
    getSetGlobalLocale(locale.key, locale.config);
    const formatted = formatMoment(getUtcTime(date), dateFormat);
    // do browsers require using GMT instead of UTC?
    return formatted.replace('UTC', 'GMT');
}
