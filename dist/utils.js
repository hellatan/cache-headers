/**
 * @ignore
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
var timeValues = require('./timeValues');

/**
 * Possible date format output
 * @type {Object}
 */
var dateFormats = Object.freeze({
    // all numbers have leading zero
    normal: 'ddd, DD MMM YYYY HH:mm:ss',
    // disregard seconds during tests
    test: 'ddd, DD MMM YYYY HH:mm'
});

/**
 * @param {*} val The value to check if it is an actual object. Arrays are not considered objects in this case
 * @return {boolean}
 */
function isTrueObject(val) {
    return !Array.isArray(val) && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' && !isEmpty(val);
}

/**
 *
 * @param {*} val The value to check if it is like a number ie. 100 and "100" would return true
 * @return {boolean}
 */
function isNumberLike(val) {
    return isNumber(val) || regular.number.test(val);
}

/**
 * @param {*} val Any JS object
 * @private
 * @return {string}
 */
function getType(val) {
    return typeof val === 'undefined' ? 'undefined' : _typeof(val);
}

/**
 * @param {object} [time] A Date object
 * @return {number}
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
 * @private
 * @return {object} A Date object
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
 * @return {object} moment object in UTC format
 */
function getUtcTime() {
    var time = arguments.length <= 0 || arguments[0] === undefined ? new Date() : arguments[0];

    return moment.utc(time);
}

/**
 *
 * @param {object} options
 * @param {object} [options.time=new Date()] Date object
 * @param {number} [options.timeToAdd=timeValues.TEN_MINUTES] A number of time to add, defaults in seconds
 * @param {string} [options.timeFormat='s'] The time format based on momentjs {{@link http://momentjs.com/docs/#/manipulating/add/}}
 * @return {object} moment object in UTC format with additional time added
 */
function addTime() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var _options$time = options.time;
    var time = _options$time === undefined ? new Date() : _options$time;
    var _options$timeToAdd = options.timeToAdd;
    var timeToAdd = _options$timeToAdd === undefined ? timeValues.TEN_MINUTES : _options$timeToAdd;
    var _options$timeFormat = options.timeFormat;
    var timeFormat = _options$timeFormat === undefined ? 's' : _options$timeFormat;

    var utcTime = getUtcTime(time);
    return utcTime.add(timeToAdd, timeFormat);
}

/**
 * Format a UTC Date value
 * @param {number} time UTC time format
 * @param {string} [formatType='normal'] Primarily used for testing
 * @return {string} header date string in GMT format
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
 * Creates a wrapping promise of promises and only resolves
 * when all promises have been resolved
 * @param {object[]} values
 * @private
 * @return {Promise}
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
 * Creates a wrapping promise of promises and only resolves
 * when all promises have been resolved
 * @param {object[]} files An array of file path strings
 * @private
 * @return {Promise}
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
 * @private
 * @return {Promise}
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
 * Gets the stats of the file. This checks whether it is an actual
 * file or a directory and delegates to other methods accordingly
 * @param {string} filePath
 * @private
 * @return {Promise}
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

/**
 * @param {string} filePath Path to the file
 * @private
 * @return {Promise}
 */
function getFileTimestamp(filePath) {
    return new Promise(function (resolve) {
        return checkTimestampFileType(filePath).then(function (resolvedTime) {
            resolve(resolvedTime);
        }).catch(function () {
            resolve(createUnixTime());
        });
    });
}

/**
 * All promises return a formatted date string to be used for response headers
 * in the format of `Mon, 21 Dec 2015 19:45:29 GMT`
 * @param {object[]|string|null|boolean} compare Array of timestamps or a single path to check the last modified time
 * @param {string} [formatType=normal] Typically used for testing. Values of `test` and `normal` are accepted
 * @return {Promise}
 */
function getLastModified() {
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

/**
 * @module utils
 * @type {{dateFormats: dateFormats, isTrueObject: isTrueObject, isNumberLike: isNumberLike, formatDate: formatDate, getUtcTime: getUtcTime, getTimestamp: getTimestamp, createUnixTime: createUnixTime, getLastModified: getLastModified, addTime: addTime}}
 */
module.exports = {
    dateFormats: dateFormats,
    isTrueObject: isTrueObject,
    isNumberLike: isNumberLike,
    formatDate: formatDate,
    getUtcTime: getUtcTime,
    getTimestamp: getTimestamp,
    createUnixTime: createUnixTime,
    getLastModified: getLastModified,
    addTime: addTime
};