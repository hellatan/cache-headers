/**
 * @ignore
 * User: daletan
 * Date: 12/21/15
 * Time: 1:38 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const fs = require('fs');
const assert = require('assert');
const moment = require('moment');
const utils = require('../src/utils');
const timeValues = require('../src/timeValues');

const EXPECT_FALSE = false;
const EXPECT_TRUE = true;

describe('utils', () => {
    describe('true object', () => {
        it('should return `false` if an array is passed in', () => {
            const actual = utils.isTrueObject([1, 2, 3]);
            assert.deepEqual(actual, EXPECT_FALSE);
        });
        it('should return `true` if an actual object is passed in', () => {
            const actual = utils.isTrueObject({ a: 1, b: 2, c: 3 });
            assert.deepEqual(actual, EXPECT_TRUE);
        });
    });

    it('should return `true` if a number is passed in as a string or number', () => {
        let actual = utils.isNumberLike('51');
        assert.deepEqual(actual, EXPECT_TRUE);
        actual = utils.isNumberLike(51);
        assert.deepEqual(actual, EXPECT_TRUE);
    });

    describe('getUtcTime', () => {
        it('should get the utc time from a Date object', () => {
            const date = new Date('2015-12-31');
            const expect = moment.utc(date);
            const actual = utils.getUtcTime(date);
            // only converting toString for comparison
            assert.strictEqual(actual.toString(), expect.toString());
        });
        it('should return the utc time from the fallback Date object', () => {
            const date = new Date();
            const expect = moment.utc(date);
            const actual = utils.getUtcTime();
            // only converting toString for comparison
            assert.strictEqual(actual.toString(), expect.toString());
        });
    });

    describe('addTime', () => {
        it('should add ten minutes to the current date (default settings)', () => {
            const date = new Date();
            const utcTime = utils.getUtcTime(date);
            const expect = utcTime.add(timeValues.TEN_MINUTES, 's');
            const actual = utils.addTime();
            assert.strictEqual(actual.toString(), expect.toString());
        });
        it('should add the passed in amount of time to the date', () => {
            const date = new Date();
            const utcTime = utils.getUtcTime(date);
            const expect = utcTime.add(timeValues.ONE_YEAR, 's');
            const actual = utils.addTime({ date , timeToAdd: timeValues.ONE_YEAR });
            assert.strictEqual(actual.toString(), expect.toString());
        });
        it('should add time based on days', () => {
            const date = new Date();
            const utcTime = utils.getUtcTime(date);
            const expect = utcTime.add(7, 'd');
            const actual = utils.addTime({ date , timeToAdd: 7, timeFormat: 'd' });
            assert.strictEqual(actual.toString(), expect.toString());
        });
    });

    describe('getTimestamp', () => {

        it('should return a number', (done) => {
            const expect = (new Date()).getTime();
            utils.getTimestamp(expect)
                .then(actual => {
                    assert.strictEqual(actual, expect);
                    done();
                });
        });

        it('should return number when passed in as a string', (done) => {
            const expect = (new Date()).getTime() + '';
            utils.getTimestamp(expect)
                .then(actual => {
                    assert.strictEqual(actual, Number(expect));
                    done();
                });
        });

        it('should create a new Date if an invalid date is passed in', () => {
            const invalid = new Date('asdfadsdf');
            utils.getTimestamp(invalid)
                .then(actual => {
                    const expect = (new Date()).getTime();
                    assert.strictEqual(actual, Number(expect));
                });

        });

        it('should return a date from a predefined date object', (done) => {
            const date = new Date('1982-10-18');
            utils.getTimestamp(date)
                .then(actual => {
                    const expect = moment.utc('1982-10-18', 'YYYY-MM-DD');
                    // convert these toISOString only for comparison
                    assert.strictEqual(actual.toISOString(), expect.toISOString());
                    done();
                });
        });
    });

    describe('file headers', () => {
        describe('single file ', () => {
            const fileName = 'testFile.json';
            const filePath = __dirname + '/' + fileName;

            beforeEach(() => {
                fs.writeFileSync(filePath, '{ "str": "this is a recording" }');
            });

            afterEach(() => {
                fs.unlinkSync(filePath);
            });

            it('should return the current time when argument is empty or null', (done) => {
                utils.getLastModified(null, 'test')
                    .then(actual => {
                        const date = new Date();
                        const isoDate = moment(date).toISOString();
                        const expect = (moment.utc(isoDate).format(utils.dateFormats.test)).toString() + " GMT";
                        assert.strictEqual(actual, expect);
                        done();
                    });
            });

            it('should get the modified time of the file', (done) => {
                fs.lstat(filePath, (err, fileStats) => {
                    return utils.getLastModified(filePath, 'test')
                        .then(actual => {
                            const isoDate = moment(fileStats.mtime).toISOString();
                            const expect = (moment.utc(isoDate).format(utils.dateFormats.test)).toString() + ' GMT';
                            assert.strictEqual(actual, expect);
                            done();
                        });
                });
            });

            it('should return the latest mod time from an array', (done) => {
                const timeBefore = new Date('1982-10-18');
                const timeAfter = new Date('2012-07-31');
                const timeBetween = new Date('2007-09-18');
                utils.getLastModified([timeBefore, timeAfter, timeBetween], 'test')
                    .then(actual => {
                        const isoDate = moment.utc('2012-07-31', 'YYYY-MM-DD').toISOString();
                        const expect = (moment.utc(isoDate).format(utils.dateFormats.test)).toString() + ' GMT';

                        assert.strictEqual(actual, expect);
                        done();
                    });
            });

        });

        describe('directory of files', () => {
            const dirPath = __dirname + '/fixtures';
            const fileNames = [1, 2];

            beforeEach(() => {
                fileNames.forEach(val => {
                    fs.writeFileSync(`${dirPath}/testFile${val}.json`, `{ "str": "this is a recording ${val}" }`);
                });
            });

            afterEach(() => {
                fileNames.forEach(val => {
                    fs.unlink(`${dirPath}/testFile${val}.json`);
                });
            });

            it('should read the mod times from a list of files', (done) => {
                const newFile = `${dirPath}/testFile3.json`;
                return fs.writeFile(newFile, `{ "str": "this is a recording 3" }`, () => {
                    const maxAge = 0;
                    const testDate = new Date();
                    const newTime = utils.addTime({ date: testDate, timeToAdd: maxAge });

                    const expiresDate = moment.utc(newTime.toISOString());
                    const format = utils.dateFormats.test;
                    const expect = expiresDate.format(format).toString() + ' GMT';

                    return utils.getLastModified(dirPath, 'test')
                        .then(actual => {
                            assert.strictEqual(actual, expect);
                            fs.unlink(newFile);
                            done();
                        });

                });
            });
        });
    });
});
