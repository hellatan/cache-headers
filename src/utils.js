/**
 * User: daletan
 * Date: 12/19/15
 * Time: 10:25 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Mon, 21 Dec 2015 19:45:29 GMT
// php: D, d M Y H:i:s
const dateFormats = Object.freeze({
    // all numbers have leading zero
    normal: 'ddd, DD MMM YYYY HH:mm:ss',
    // disregard seconds during tests
    test: 'ddd, DD MMM YYYY HH:mm'
});

/**
 * @param {*} val Any JS object
 * @returns {string}
 */
function getType(val) {
    return typeof val;
}

/**
 * @param {object} [time] A Date object
 * @returns {number}
 */
function createUnixTime(time) {
    if (!time || (time === (void 0))) {
        // void 0 => undefined
        time = new Date();
    }
    // convert milliseconds to seconds
    return Math.round(moment.unix(time) / 1000);
}

/**
 * @param {array} [timestamps] An array of Dates
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
function format(time, formatType = 'normal') {
    if (moment.isMoment(time)) {
        time = time.toISOString();
    }
    const format = dateFormats[formatType] || dateFormats['normal'];
    return (getUtcTime(time).format(format)).toString() + ' GMT';
}

/**
 * Promise returns a number or a moment timestamp object
 * @param time
 * @returns {*}
 * @return {Promise}
 */
function getTimestamp(time) {
    return new Promise((resolve, reject) => {

        if (getType(time) === 'number' || (getType(time) === 'string' && +time === +time)) {
            return resolve(+time);
        }

        const timestamp = moment.utc(new Date(time));
        if (timestamp.isValid()) {
            return resolve(timestamp);
        }

        return reject(time);
    });
}

/**
 *
 * @param {object[]} values
 * @returns {Promise}
 */
function arrayOfTimestamps(values) {
    const promises = [];
    values.forEach(value => {
        promises.push(
            getTimestamp(value)
        );
    });
    return Promise.all(promises);
}

/**
 * Gets the last modified time of a list of files
 * @param {object[]} files An array of file path strings
 * @returns {Promise}
 */
function arrayOfTimestampsFiles(files) {
    const promises = [];

    files.forEach(file => {
        promises.push(
            function () {
                return new Promise((resolve, reject) => {
                    fs.lstat(file, (err, fileStats) => {
                        if (err) {
                            return reject(err);
                        }
                        if (fileStats.isFile()) {
                            return resolve(getTimestamp(fileStats.mtime));
                        }
                        return resolve(0);
                    })
                });
            }()
        );
    });
    return Promise.all(promises);
}

/**
 * @param {string} dirPath The directory to look into
 * @returns {Promise}
 */
function getTimestampFromDirectory(dirPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                return reject(err);
            }

            files = files.map(file => {
                // prepend the `dirPath` to each file
                return path.resolve(dirPath, file);
            });

            return arrayOfTimestampsFiles(files)
                .then(timestamps => {
                    const latestTimestamp = getLatestTimestamp(timestamps);
                    const time = createUnixTime(latestTimestamp ? latestTimestamp : null);
                    return resolve(time);
                })
                .catch(err => reject(err));
        });
    });
}

/**
 *
 * @param {string} filePath
 * @returns {Promise}
 */
function checkTimestampFileType(filePath) {
    return new Promise((resolve, reject) => {
        // const path = fs.realpathSync(filePath);
        fs.realpath(filePath, (err, path) => {
            // const fileStats = fs.lstatSync(path);
            fs.lstat(path, (err, fileStats) => {
                if (fileStats.isFile()) {
                    return resolve(createUnixTime(fileStats.mtime));
                }
                if (fileStats.isDirectory()) {
                    return resolve(getTimestampFromDirectory(path));
                }
                return reject(false);
            });
        });
    });
}

function getFileTimestamp(time) {
    return new Promise((resolve, reject) => {
        return checkTimestampFileType(time)
            .then(resolvedTime => {
                resolve(resolvedTime);
            })
            .catch(() => {
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
    dateFormats,
    format,
    getUtcTime,
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
    /**
     * All promises return a formatted date string to be used for response headers
     * in the format of `Mon, 21 Dec 2015 19:45:29 GMT`
     * @param {array|string|null|false} compare Array of timestamps or a single path to check the last modified time
     * @param {string} [formatType=normal] Typically used for testing. Values of `test` and `normal` are accepted
     * @returns {Promise}
     */
    getLastModified(compare = null, formatType = 'normal') {
        return new Promise((resolve, reject) => {
            if (Array.isArray(compare) && compare.length > 0) {
                return arrayOfTimestamps(compare)
                    .then(timestamps => {
                        const latestTimestamp = getLatestTimestamp(timestamps);
                        return resolve(format(latestTimestamp, formatType));
                    })
                    .catch(err => reject(err));
            } else if (getType(compare) === 'string' && compare !== '') {
                return getTimestamp(compare)
                    .then(timestamp => {
                        resolve(format(timestamp, formatType));
                    })
                    .catch(() => {
                        getFileTimestamp(compare)
                            .then(timestamp => {
                                resolve(format(timestamp, formatType));
                            })
                            .catch(err => reject(err));
                    });
            }
            return resolve(format(createUnixTime(), formatType));
        });
    }
};
