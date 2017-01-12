/**
 * @ignore
 * User: daletan
 * Date: 12/26/15
 * Time: 12:44 AM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

import * as api from '../src';
import {NO_CACHE_NO_STORE} from '../src/cacheControl';
import {
    KEY_LAST_MODIFIED,
    KEY_STALE_IF_ERROR,
    KEY_STALE_WHILE_REVALIDATE,
    KEY_SURROGATE_CONTROL
} from '../src/headerTypes';
import * as timeValues from '../src/timeValues';
import assert from 'assert';
import express from 'express';
import supertest from 'supertest';
import async from 'async';

const HEADER_CACHE_CONTROL = 'Cache-Control';
const HEADER_PRAGMA = 'Pragma';
const HEADER_EXPIRES = 'Expires';
const HEADER_SURROGATE_CONTROL = 'Surrogate-Control';

const caches = {
    cacheSettings: {},
    paths: {
        '/**/subpath': "31536000",
        '/root/sub': {
            [KEY_LAST_MODIFIED]: -1,
            [KEY_SURROGATE_CONTROL]: 300,
            [KEY_STALE_WHILE_REVALIDATE]: 400,
            [KEY_STALE_IF_ERROR]: 600
        },
        '/root/**': false,
        '/root': 1024,
        '/obj': {
            [HEADER_CACHE_CONTROL]: 'no-cache',
            [HEADER_SURROGATE_CONTROL]: 'maxAge=10'
        }
    }
};

describe('cache control index', function () {

    let app;
    let agent;

    beforeEach(function () {
        app = express();
        agent = supertest(app);
    });

    it('should have default cache time values', function () {
        // make sure default cache values are attached to public api
        Object.keys(timeValues).forEach(val => {
            assert.deepEqual(api[val], timeValues[val]);
        });
    });

    describe('application-level middleware', function () {

        beforeEach(() => {
            app.use(api.middleware(caches));
        });

        describe('initial paths', function () {
            it('should get a nested path', (done) => {
                agent.get('/root/sub/subpath')
                    .expect(HEADER_CACHE_CONTROL, NO_CACHE_NO_STORE)
                    .expect(HEADER_SURROGATE_CONTROL, 'max-age=31536000')
                    .expect(HEADER_PRAGMA, 'no-cache')
                    .expect(HEADER_EXPIRES, 0)
                    .end(done);
            });
            it('should get an exact match', function (done) {
                const cacheControlValue = `${NO_CACHE_NO_STORE}, stale-while-revalidate=400, stale-if-error=600`;
                agent.get('/root/sub')
                    .expect(HEADER_CACHE_CONTROL, cacheControlValue)
                    .expect(HEADER_SURROGATE_CONTROL, 'max-age=300')
                    .end(done);
            });
            it('should get any match', function (done) {
                agent.get('/root/something/subbby')
                    .expect(HEADER_CACHE_CONTROL, `private, ${NO_CACHE_NO_STORE}`)
                    .expect(HEADER_SURROGATE_CONTROL, 'max-age=0')
                    .end(done);
            });
        });

        it('should override default cache settings', (done) => {

            const router = express.Router(); // eslint-disable-line new-cap
            app.use(router);

            router.get('/root/sub', api.middleware({
                cacheSettings: {
                    maxAge: 300
                }
            }));

            agent
                .get('/root/sub')
                .expect(HEADER_CACHE_CONTROL, NO_CACHE_NO_STORE)
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=300')
                .expect('Pragma', 'no-cache')
                .expect('Expires', 0)
                .end(done);
        });

        it('should set default values when nothing is passed in', (done) => {
            app = express();
            agent = supertest(app);
            app.use(api.middleware());

            agent
                .get('/root/sub')
                .expect(HEADER_CACHE_CONTROL, NO_CACHE_NO_STORE)
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=600')
                .expect('Pragma', 'no-cache')
                .expect('Expires', 0)
                .end(done);
        });

    });

    describe('router-level middleware', function () {

        let router;

        beforeEach(function () {
            router = express.Router(); // eslint-disable-line new-cap
            router.use(api.middleware(caches));
            app.use(router);
        });

        describe('path object', function () {
            it('should set the default cache header if invalid object settings are passed in', function (done) {
                router.get('/obj', api.middleware({
                    paths: {
                        '/obj': {
                            notValid: 10
                        }
                    }
                }));
                agent
                    .get('/obj')
                    .expect(HEADER_CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .expect(HEADER_SURROGATE_CONTROL, 'max-age=600')
                    .end(done);
            });
        });

        it('sets surrogate control to the passed string if specified in route-specific config file', function (done) {
            router.get('/root/other', api.middleware({
                cacheSettings: {
                    [KEY_SURROGATE_CONTROL]: 100
                }
            }));
            agent
                .get('/root/other')
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=100')
                .end(done);
        });

        it('sets surrogate control to 600 seconds by default', function (done) {
            agent
                .get('/')
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=600')
                .end(done);
        });

        it('sets the surrogate control to 600 seconds by default if no config is provided', function (done) {
            agent
                .get('/')
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=600')
                .end(done);
        });

        it('should overwrite default cache settings', (done) => {
            router.get('/test/subpath', api.middleware({
                cacheSettings: {
                    [KEY_SURROGATE_CONTROL]: "3000"
                }
            }));
            agent
                .get('/test/subpath')
                .expect(HEADER_SURROGATE_CONTROL, 'max-age=3000')
                .end(done);
        });

        it('sets cache control using glob negation', function (done) {
            router = express.Router(); // eslint-disable-line new-cap
            router.use(api.middleware({
                paths: {
                    // any route that does NOT start with /anything
                    // should have minimal caches
                    '!/anything/**': false
                }
            }));
            app = express();
            app.use(router);
            agent = supertest(app);

            async.parallel([
                function (cb) {
                    agent
                        .get('/negation')
                        .expect(HEADER_CACHE_CONTROL, "private, no-cache, no-store, must-revalidate")
                        .expect(HEADER_SURROGATE_CONTROL, 'max-age=0')
                        .end(cb);
                },
                function (cb) {
                    agent
                        .get('/anything/test.html')
                        .expect(HEADER_CACHE_CONTROL, 'no-cache, no-store, must-revalidate')
                        .expect(HEADER_SURROGATE_CONTROL, 'max-age=600')
                        .end(cb);
                }
            ], done);
        });

    });

    describe('setAdditionalHeaders', function () {
        it("should set headers passed in", (done) => {
            const headers = [
                {
                    'custom-header': 'yes',
                    'another-header': 100
                },
                {
                    name: 'set-by-name',
                    value: 'set by value'
                }
            ];

            app.use(api.setAdditionalHeaders(headers));
            agent
                .get('/')
                .expect('custom-header', 'yes')
                .expect('another-header', 100)
                .expect('set-by-name', 'set by value')
                .end(done);
        });
    });
});
