/**
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

describe('utils', () => {
    it('should return a number', () => {
        const expect = (new Date()).getTime();
        utils.getTimestamp(expect)
            .then(actual => assert.strictEqual(actual, expect))
            .catch(err => assert.fail(err))
            .then(() => {
                done();
            });
    });

    it('should return number when passed in as a string', () => {
        const expect = (new Date()).getTime() + '';
        utils.getTimestamp(expect)
            .then(actual => assert.strictEqual(actual, +expect))
            .catch(err => assert.fail(err))
            .then(() => {
                done();
            });
    });

    it('should create a unix timestamp', () => {
        const time = (new Date()).getTime();
        const seconds = time / 1000;

    });

    describe('file headers', () => {
        describe('single file ', () => {
            const fileName = 'testFile.json';
            const filePath = __dirname + '/' + fileName;
            let file;

            beforeEach(() => {
                fs.writeFileSync(filePath, '{ "str": "this is a recording" }');
                file = require('./' + fileName);
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
                    })
                    .catch(err => assert.fail(err))
                    .then(() => {
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
                        })
                        .catch(err => {
                            assert.fail(err);
                        })
                        .then(() => {
                            done();
                        });
                });
            });

            it('should return the latest mod time from an array', (done) => {
                const timeBefore = new Date('1982-10-18');
                const timeAfter = new Date('2012-07-31');
                const timeBetween = new Date('2007-09-18');
                //const actual =
                utils.getLastModified([timeBefore, timeAfter, timeBetween], 'test')
                    .then(actual => {
                        const isoDate = moment.utc('2012-07-31', 'YYYY-MM-DD').toISOString();
                        const expect = (moment.utc(isoDate).format(utils.dateFormats.test)).toString() + ' GMT';

                        assert.strictEqual(actual, expect);
                    })
                    .catch(err => assert.fail(err))
                    .then(() => {
                        done();
                    });
            });

            // test for invalid date as well
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
                    const utcTime = moment.utc(testDate);
                    const newTime = utcTime.add(maxAge);
                    const expiresDate = moment.utc(newTime.toISOString());
                    const format = utils.dateFormats.test;
                    const expect = expiresDate.format(format).toString() + ' GMT';

                    return utils.getLastModified(dirPath, 'test')
                        .then(actual => {
                            assert.strictEqual(actual, expect);
                        })
                        .catch(err => {
                            assert.fail(err);
                        })
                        .then(() => {
                            fs.unlink(newFile);
                            done();
                        })

                });
            });
        });
    });
});
