/**
 * User: daletan
 * Date: 12/19/15
 * Time: 10:25 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var regular = require('regular');
var isNumber = require('lodash.isnumber');
var isEmpty = require('lodash.isempty');

// Mon, 21 Dec 2015 19:45:29 GMT
// php: D, d M Y H:i:s
var dateFormats = Object.freeze({
    // all numbers have leading zero
    normal: 'ddd, DD MMM YYYY HH:mm:ss',
    // disregard seconds during tests
    test: 'ddd, DD MMM YYYY HH:mm'
});

function isTrueObject(obj) {
    return !Array.isArray(obj) && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && !isEmpty(obj);
}

function isNumberLike(val) {
    return isNumber(val) || regular.number.test(val);
}

/**
 * @param {*} val Any JS object
 * @returns {string}
 */
function getType(val) {
    return typeof val === 'undefined' ? 'undefined' : _typeof(val);
}

/**
 * @param {object} [time] A Date object
 * @returns {number}
 */
function createUnixTime(time) {
    if (!time || time === void 0) {
        // void 0 => undefined
        time = new Date();
    }
    // convert milliseconds to seconds
    return Math.round(moment.unix(time) / 1000);
}

/**
 * @param {object[]} [timestamps] An array of Dates
 * @returns {object} A Date object
 */
function getLatestTimestamp() {
    var timestamps = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    timestamps.sort(function (a, b) {
        var unixTimeA = createUnixTime(a);
        var unixTimeB = createUnixTime(b);
        return unixTimeA > unixTimeB;
    });
    return timestamps.reverse()[0];
}

/**
 * @param {object} [time] Date object
 * @returns {object} moment object in UTC format
 */
function getUtcTime(time) {
    time = time || new Date();
    return moment.utc(time);
}

/**
 * Format a UTC Date value
 * @param {number} time UTC time format
 * @param {string} [formatType='normal'] Primarily used for testing
 * @returns {string} header date string in GMT format
 */
function formatDate(time) {
    var formatType = arguments.length <= 1 || arguments[1] === undefined ? 'normal' : arguments[1];

    if (moment.isMoment(time)) {
        time = time.toISOString();
    }
    var format = dateFormats[formatType] || dateFormats.normal;
    return getUtcTime(time).format(format).toString() + ' GMT';
}

/**
 * Promise returns a number or a moment timestamp object
 * @param {number|string|object} time if an object, a Date object
 * @returns {*}
 * @return {Promise}
 */
function getTimestamp(time) {
    return new Promise(function (resolve) {

        if (getType(time) === 'number' || getType(time) === 'string' && +time === +time) {
            return resolve(+time);
        }

        var timestamp = moment.utc(new Date(time));
        if (timestamp.isValid()) {
            return resolve(timestamp);
        }

        time = moment.utc(new Date());

        return resolve(+time);
    });
}

/**
 *
 * @param {object[]} values
 * @returns {Promise}
 */
function arrayOfTimestamps(values) {
    var promises = [];
    values.forEach(function (value) {
        promises.push(getTimestamp(value));
    });
    return Promise.all(promises);
}

/**
 * Gets the last modified time of a list of files
 * @param {object[]} files An array of file path strings
 * @returns {Promise}
 */
function arrayOfTimestampsFiles(files) {
    var promises = [];

    files.forEach(function (file) {
        promises.push((function () {
            return new Promise(function (resolve, reject) {
                fs.lstat(file, function (err, fileStats) {
                    if (err) {
                        return reject(err);
                    }
                    if (fileStats.isFile()) {
                        return resolve(getTimestamp(fileStats.mtime));
                    }
                    return resolve(0);
                });
            });
        })());
    });
    return Promise.all(promises);
}

/**
 * @param {string} dirPath The directory to look into
 * @returns {Promise}
 */
function getTimestampFromDirectory(dirPath) {
    return new Promise(function (resolve, reject) {
        fs.readdir(dirPath, function (err, files) {
            if (err) {
                return reject(err);
            }

            files = files.map(function (file) {
                // prepend the `dirPath` to each file
                return path.resolve(dirPath, file);
            });

            return arrayOfTimestampsFiles(files).then(function (timestamps) {
                var latestTimestamp = getLatestTimestamp(timestamps);
                var time = createUnixTime(latestTimestamp ? latestTimestamp : null);
                return resolve(time);
            }).catch(function () {
                reject(createUnixTime());
            });
        });
    });
}

/**
 *
 * @param {string} filePath
 * @returns {Promise}
 */
function checkTimestampFileType(filePath) {
    return new Promise(function (resolve, reject) {
        fs.realpath(filePath, function (err, realFilePath) {
            fs.lstat(realFilePath, function (statErr, fileStats) {
                if (fileStats.isFile()) {
                    return resolve(createUnixTime(fileStats.mtime));
                }
                if (fileStats.isDirectory()) {
                    return resolve(getTimestampFromDirectory(realFilePath));
                }
                return reject(false);
            });
        });
    });
}

function getFileTimestamp(time) {
    return new Promise(function (resolve) {
        return checkTimestampFileType(time).then(function (resolvedTime) {
            resolve(resolvedTime);
        }).catch(function () {
            resolve(createUnixTime());
        });
    });
}

/**
 * @module utils
 * @type {{
 *  dateFormats: Object,
 *  format: format,
 *  getUtcTime: getUtcTime,
 *  getTimestamp: getTimestamp,
 *  createUnixTime: createUnixTime,
 *  checkModTimes,
 *  getLastModified
 * }}
 */
module.exports = {
    dateFormats: dateFormats,
    isTrueObject: isTrueObject,
    isNumberLike: isNumberLike,
    formatDate: formatDate,
    getUtcTime: getUtcTime,
    getTimestamp: getTimestamp,
    createUnixTime: createUnixTime,
    /**
     * @description If NULLs are found in modTimes array, returns FALSE
     * @param array modTimes
     * @return bool
     */
    checkModTimes: function checkModTimes() {
        var modTimes = arguments.length <= 0 || arguments[0] === undefined ? [null] : arguments[0];

        var nulls = modTimes.filter(function (val) {
            return typeof val !== null;
        });
        if (nulls.length === 0) {
            return true;
        }
        return false;
    },

    /**
     * All promises return a formatted date string to be used for response headers
     * in the format of `Mon, 21 Dec 2015 19:45:29 GMT`
     * @param {array|string|null|false} compare Array of timestamps or a single path to check the last modified time
     * @param {string} [formatType=normal] Typically used for testing. Values of `test` and `normal` are accepted
     * @returns {Promise}
     */
    getLastModified: function getLastModified() {
        var compare = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        var formatType = arguments.length <= 1 || arguments[1] === undefined ? 'normal' : arguments[1];

        return new Promise(function (resolve, reject) {
            if (Array.isArray(compare) && compare.length > 0) {
                return arrayOfTimestamps(compare).then(function (timestamps) {
                    var latestTimestamp = getLatestTimestamp(timestamps);
                    return resolve(formatDate(latestTimestamp, formatType));
                }).catch(function (err) {
                    return reject(err);
                });
            } else if (getType(compare) === 'string' && compare !== '') {
                return getTimestamp(compare).then(function (timestamp) {
                    resolve(formatDate(timestamp, formatType));
                }).catch(function () {
                    getFileTimestamp(compare).then(function (timestamp) {
                        resolve(formatDate(timestamp, formatType));
                    }).catch(function (err) {
                        return reject(err);
                    });
                });
            }
            return resolve(formatDate(createUnixTime(), formatType));
        });
    }
};