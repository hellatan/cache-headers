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
        const maxAge = 0;
        const testDate = new Date();
        const utcTime = moment.utc(testDate);
        const newTime = utcTime.add(maxAge);
        const expiresDate = moment.utc(newTime.toISOString());
        const format = utils.dateFormats.test;
        const formatted = expiresDate.format(format);
        const expect = `Expires: ${formatted} GMT`;
        const actual = additionalHeaders.generateExpiresHeader({
            maxAge,
            testDate,
            formatType: 'test'
        });

        assert.strictEqual(actual, expect);
    });

});
