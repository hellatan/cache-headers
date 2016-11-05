/**
 * @ignore
 * User: daletan
 * Date: 12/21/15
 * Time: 1:38 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

import assert from 'assert';
import {isNonEmptyObject, isNumberLike, formatDate} from '../src/utils';
import {getSetGlobalLocale} from 'moment/src/lib/locale/locale';
import fr from 'moment/src/locale/fr';

const EXPECT_FALSE = false;
const EXPECT_TRUE = true;

describe('utils', function () {
    describe('true object', function () {
        it('should return `false` if an array is passed in', () => {
            const actual = isNonEmptyObject([1, 2, 3]);
            assert.deepEqual(actual, EXPECT_FALSE);
        });
        it('should return `false` if an actual empty object is passed in', () => {
            const actual = isNonEmptyObject({});
            assert.deepEqual(actual, EXPECT_FALSE);
        });
        it('should return `true` if an actual object is passed in', () => {
            const actual = isNonEmptyObject({ a: 1, b: 2, c: 3 });
            assert.deepEqual(actual, EXPECT_TRUE);
        });
    });

    describe('isNumberLike', function () {
        it('should return `true` if a number is passed in as a string or number', function () {
            let actual = isNumberLike('51');
            assert.deepEqual(actual, EXPECT_TRUE);
            actual = isNumberLike(51);
            assert.deepEqual(actual, EXPECT_TRUE);
        });
        it('should return false if a passed in a non-number-like value', function () {
            let actual = isNumberLike(false);
            assert.deepEqual(actual, EXPECT_FALSE);
            actual = isNumberLike('derp');
            assert.deepEqual(actual, EXPECT_FALSE);
        });
    });

    describe('formatDate', function () {
        const date = new Date('2001-01-01');
        const formatted = 'Mon, 01 Jan 2001 00:00:00 GMT';
        beforeEach(function () {
            // not doing this makes `fr` the locale for every test
            getSetGlobalLocale('en');
        });
        it('should format the date based on the default format', function () {
            const now = formatDate({date});
            assert.equal(now, formatted);
        });
        it('should format the date based on the passed in format', function () {
            const now = formatDate({date, dateFormat: 'ddd YYYY'});
            assert.equal(now, 'Mon 2001');
        });
        it('should format the date based on the passed in format and locale config', function () {
            const locale = {
                key: 'fr',
                config: fr
            };
            const now = formatDate({date, dateFormat: 'ddd YYYY', locale});
            assert.equal(now, 'lun. 2001');
        });
    });

});
