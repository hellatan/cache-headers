/**
 * User: daletan
 * Date: 12/31/15
 * Time: 10:41 AM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const assert = require('assert');
const timeValues = require('../src/timeValues');

describe('timeValues', () => {
    it('should have all the correct time values in seconds', () => {
        assert.strictEqual(timeValues.ONE_MINUTE, 60);
        assert.strictEqual(timeValues.TEN_MINUTES, 600);
        assert.strictEqual(timeValues.ONE_HOUR, 3600);
        assert.strictEqual(timeValues.ONE_DAY, 86400);
        assert.strictEqual(timeValues.ONE_WEEK, 604800);
        assert.strictEqual(timeValues.ONE_MONTH, 2592000);
        assert.strictEqual(timeValues.ONE_YEAR, 31536000);
    });
});
