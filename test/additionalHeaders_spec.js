/**
 * @ignore
 * User: daletan
 * Date: 12/22/15
 * Time: 7:30 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const assert = require('assert');
const additionalHeaders = require('../src/additionalHeaders');
const utils = require('../src/utils');

describe('additional headers methods', () => {

    it('should create a new expires header', () => {
        const formatType = 'test';
        const maxAge = 100;
        const testDate = new Date();
        const newTime = utils.addTime({ date: testDate, timeToAdd: maxAge });
        const value = utils.formatDate(newTime, formatType);
        const expect = {
            name: 'Expires',
            value
        };
        const actual = additionalHeaders.generateExpiresHeader({
            maxAge,
            testDate,
            formatType
        });

        assert.deepEqual(actual, expect);
    });

    it('should create a new last modified header', () => {
        const formatType = 'test';
        const testDate = new Date('2015-12-25 12:02:01');
        const value = utils.formatDate(testDate, 'test');
        const expect = {
            name: 'Last-Modified',
            value
        };
        const actual = additionalHeaders.generateLastModifiedHeader({
            date: testDate,
            formatType
        });

        assert.deepEqual(actual, expect);
    });

    it('should default to "normal" format type', () => {
        const formatType = 'invalid format typeest';
        const testDate = new Date('2015-12-25 12:02:01');
        const value = utils.formatDate(testDate, 'normal');
        const expect = {
            name: 'Last-Modified',
            value
        };
        const actual = additionalHeaders.generateLastModifiedHeader({
            date: testDate,
            formatType
        });

        assert.deepEqual(actual, expect);
    });

});

