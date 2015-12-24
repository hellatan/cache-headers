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

function getType(val) {
    return typeof val;
}

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
                    // Mon, 21 Dec 2015 19:45:29 GMT
                    // ddd, DD MMM YYYY HH:mm:ss
                    const time = createUnixTime(latestTimestamp ? latestTimestamp : null);
                    return resolve(time);
                })
                .catch(err => reject(err));
        });
    });

}

function checkTimestampFileType(filePath) {
    return new Promise((resolve, reject) => {
        const path = fs.realpathSync(filePath);
        const fileStats = fs.lstatSync(path);
        if (fileStats.isFile()) {
            return resolve(createUnixTime(fileStats.mtime));
        }
        if (fileStats.isDirectory()) {
            return resolve(getTimestampFromDirectory(path));
        }
        return reject(false);
    });
}

/**
 *
 * @param time
 * @returns {*}
 * @return number - timestamp
 */
function getTimestamp(time) {
    return new Promise((resolve, reject) => {

        if (getType(time) === 'number') {
            return resolve(time);
        }
        if (getType(time) === 'string' && +time === +time) {
            return resolve(+time);
        }

        const timestamp = moment.utc(new Date(time));
        if (timestamp.isValid()) {
            return resolve(timestamp);
        }

        return checkTimestampFileType(time)
            .then(time => {
                resolve(time);
            })
            .catch(() => {
                resolve(createUnixTime());
            });
    });
}

function arrayOfTimestamps(values) {
    const promises = [];
    values.forEach(value => {
        promises.push(
            getTimestamp(value)
        );
    });
    return Promise.all(promises);
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
    /**
     *
     * @param {array|string|null|false} compare Array of timestamps or a single path to check the last modified time
     * @param formatType
     * @returns {Promise}
     */
    getLastModified(compare = null, formatType = 'normal') {
        return new Promise((resolve, reject) => {
            if (Array.isArray(compare) && compare.length > 0) {
                return arrayOfTimestamps(compare)
                    .then(timestamps => {
                        const latestTimestamp = getLatestTimestamp(timestamps);
                        // Mon, 21 Dec 2015 19:45:29 GMT
                        // ddd, DD MMM YYYY HH:mm:ss
                        return resolve(format(latestTimestamp, formatType));
                    })
                    .catch(err => reject(err));
            } else if (getType(compare) === 'string' && compare !== '') {
                return getTimestamp(compare)
                    .then(timestamp => {
                        resolve(format(timestamp, formatType));
                    })
                    .catch(err => reject(err));
            }
            return resolve(format(createUnixTime(), formatType));
        });
    }
};
