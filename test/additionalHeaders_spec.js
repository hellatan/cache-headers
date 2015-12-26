/**
 * User: daletan
 * Date: 12/22/15
 * Time: 7:30 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const assert = require('assert');
const moment = require('moment');
const additionalHeaders = require('../src/additionalHeaders');
const utils = require('../src/utils');

describe('additional headers methods', () => {

    it('should create a new expires header', () => {
        const formatType = 'test';
        const maxAge = 100;
        const testDate = new Date();
        const utcTime = moment.utc(testDate);
        const newTime = utcTime.add(maxAge);
        const headerValue = utils.format(newTime, formatType);
        const expect = {
            headerName: 'Expires',
            headerValue
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
        const headerValue = utils.format(testDate, 'test');
        const expect = {
            headerName: 'Last-Modified',
            headerValue
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
        const headerValue = utils.format(testDate, 'normal');
        const expect = {
            headerName: 'Last-Modified',
            headerValue
        };
        const actual = additionalHeaders.generateLastModifiedHeader({
            date: testDate,
            formatType
        });

        assert.deepEqual(actual, expect);
    });

});

