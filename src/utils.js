/**
 * User: daletan
 * Date: 12/19/15
 * Time: 10:25 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const fs = require('fs');
const moment = require('moment');

// Mon, 21 Dec 2015 19:45:29 GMT
// php: D, d M Y H:i:s
const dateFormats = Object.freeze({
    // all numbers have leading zero
    normal: 'ddd, DD MMM YYYY HH:mm:ss',
    // disregard seconds during tests
    test: 'ddd, DD MMM YYYY HH:mm'
});

function createUnixTime(time) {
    if (time === (void 0)) {
        time = new Date();
    }
    // convert milliseconds to seconds
    return Math.round(moment.unix(time) / 1000);
}

/**
 *
 * @param {array} timestamps An array of Dates
 * @returns {object} A Date object
 */
function getLatestTimestamp(timestamps = []) {
    timestamps.sort((a, b) => {
        const unixTimeA = createUnixTime(a);
        const unixTimeB = createUnixTime(b);
        return unixTimeA > unixTimeB;
    });
    return timestamps.reverse()[0];
}

/**
 *
 * @param {number} time UTC time format
 * @param {string} [formatType='normal'] Primarily used for testing
 * @returns {*}
 */
function format(time, formatType = 'normal') {
    if (typeof time.toISOString === 'function') {
        // this is a moment date object/instance
        time = time.toISOString();
    }
    return (moment.utc(time).format(dateFormats[formatType || 'normal'])).toString() + ' GMT';
}


function getType(val) {
    return typeof val;
}

function convertFromString(time) {
    const date = format(time);
    return date.isValid() ? date : false;
}

function createTimestampFromDirectory(dirPath, formatType) {
    const files = fs.readdirSync(dirPath);
    const timestamps = [];

    files.forEach(file => {
        const _file = fs.lstatSync(dirPath + '/' + file);
        if (_file.isFile()) {
            timestamps.push(_file.mtime);
        }
    });

    const latestTimestamp = getLatestTimestamp(timestamps);

    if (latestTimestamp) {
        return createUnixTime(latestTimestamp, formatType);
    }

    // unix time
    return createUnixTime(formatType);
}

function checkTimestampFileType(filePath, formatType) {
    const path = fs.realpathSync(filePath);
    const fileStats = fs.lstatSync(path);
    if (fileStats.isFile()) {
        return format(fileStats.mtime, formatType);
    }
    if (fileStats.isDirectory()) {
        return createTimestampFromDirectory(path, formatType);
    }
    return false;

}

/**
 *
 * @param time
 * @returns {*}
 * @return number - timestamp
 */
function getTimestamp(time, formatType) { // ($var)
    if (getType(time) === 'number') {
        return time;
    }
    if (getType(time) === 'string' && +time === +time) {
        return +time;
    }

    const timestamp = moment.utc(new Date(time));
    if (timestamp.isValid()) {
        return timestamp;
    }

    const fileWithTimestamp = checkTimestampFileType(time, formatType);
    if (fileWithTimestamp) {
        return fileWithTimestamp;
    }

    return createUnixTime(formatType);
}

module.exports = {
    dateFormats,
    // expose for testing
    _format: format,
    getTimestamp,
    createUnixTime,
    /**
     * @description If NULLs are found in modTimes array, returns FALSE
     * @param array modTimes
     * @return bool
     */
    checkModTimes(modTimes = [null]) {
        const nulls = modTimes.filter(val => {
            return typeof val !== null;
        });
        if (nulls.length === 0) {
            return true;
        }
        return false;
    },
    getLastModified(compare = null, formatType = 'normal') {
        const timestamps = [];

        if (Array.isArray(compare) && compare.length > 0) {
            // Compare
            compare.forEach(value => {
                timestamps.push(getTimestamp(value));
            });

            const latestTimestamp = getLatestTimestamp(timestamps);

            // Mon, 21 Dec 2015 19:45:29 GMT
            // ddd, DD MMM YYYY HH:mm:ss
            return format(latestTimestamp, formatType);
        } else if (getType(compare) === 'string' && compare !== '') {
            // Nothing to compare
            return format(getTimestamp(compare), formatType);
        }
        return format(createUnixTime(), formatType);
    }
};
