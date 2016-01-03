/**
 * User: daletan
 * Date: 12/26/15
 * Time: 12:44 AM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

const cacheControl = require('../src');
const express = require('express');
const supertest = require('supertest');
const async = require('async');
const caches = {
    cacheSettings: {},
    paths: {
        '/**/subpath': "31536000",
        '/root/sub': 'private, max-age=300',
        '/root/**': false,
        '/root': false,
        '/obj': { maxAge: 10 }
    }
};

describe('cache control middleware', function () {

    let app;
    let agent;

    beforeEach(function () {
        app = express();
        agent = supertest(app);
    });

    describe('application-level middleware', () => {

        beforeEach(() => {
            app.use(cacheControl.middleware(caches));
        });

        it('should set cache default cache settings', (done) => {
            agent
                .get('/test/subpath')
                .expect('Cache-Control', 'max-age=31536000, s-maxage=31536000')
                .end(done);
        });

        it('should set override default cache settings', (done) => {

            const router = express.Router(); // eslint-disable-line new-cap
            app.use(router);

            router.get('/root/sub', cacheControl.middleware({
                cacheSettings: {
                    maxAge: 300
                }
            }));

            agent
                .get('/root/sub')
                .expect('Cache-Control', 'max-age=300')
                .end(done);
        });

        it('should set default values when nothing is passed in', (done) => {
            app = express();
            agent = supertest(app);
            app.use(cacheControl.middleware());

            agent
                .get('/root/sub')
                .expect('Cache-Control', 'max-age=600')
                .end(done);
        });

    });

    describe('router-level middleware', () => {

        let router;

        beforeEach(function () {
            router = express.Router(); // eslint-disable-line new-cap
            router.use(cacheControl.middleware(caches));
            app.use(router);
        });

        describe('path object', () => {

            it('should set the default cache header if invalid object settings are passed in', (done) => {
                router.get('/obj', cacheControl.middleware({
                    paths: {
                        '/obj': {
                            notValid: 10
                        }
                    }
                }));
                agent
                    .get('/obj')
                    .expect('Cache-Control', 'max-age=600')
                    .end(done);
            });

            it('should set the cache header if an object is passed into the path', (done) => {
                agent
                    .get('/obj')
                    .expect('Cache-Control', 'max-age=10')
                    .end(done);
            });

        });

        it('sets the `max-age` and `s-maxage` cache header if specified as only a number or number-like value in the config', function (done) {
            agent
                .get('/test/subpath')
                .expect('Cache-Control', 'max-age=31536000, s-maxage=31536000')
                .end(done);
        });

        it('sets cache control to no-cache if `false` is specified in config file', function (done) {
            agent
                .get('/root')
                .expect('Cache-Control', 'no-cache, max-age=0')
                .end(done);
        });

        it('sets cache control to the passed string if specified in original config file', function (done) {
            agent
                .get('/root/sub')
                .expect('Cache-Control', 'private, max-age=300')
                .end(done);
        });

        it('sets cache control to the passed string if specified in route-specific config file', function (done) {
            router.get('/root/other', cacheControl.middleware({
                cacheSettings: {
                    maxAge: 100
                }
            }));
            agent
                .get('/root/other')
                .expect('Cache-Control', 'max-age=100')
                .end(done);
        });

        it('sets cache control to 600 seconds by default', function (done) {
            agent
                .get('/')
                .expect('Cache-Control', 'max-age=600')
                .end(done);
        });

        it('sets the cache control to 600 seconds by default if no config is provided', function (done) {
            agent
                .get('/')
                .expect('Cache-Control', 'max-age=600')
                .end(done);
        });

        it('should overwrite default cache settings', (done) => {
            router.get('/test/subpath', cacheControl.middleware({
                cacheSettings: {
                    'maxAge': "3000"
                }
            }));
            agent
                .get('/test/subpath')
                .expect('Cache-Control', 'max-age=3000')
                .end(done);
        });

        it('sets cache control using glob negation', function (done) {

            router = express.Router(); // eslint-disable-line new-cap
            router.use(cacheControl.middleware({
                paths:{
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
                        .expect('Cache-Control', 'no-cache, max-age=0')
                        .end(cb);
                },
                function (cb) {
                    agent
                        .get('/anything/test.html')
                        .expect('Cache-Control', 'max-age=600')
                        .end(cb);
                }
            ], done);
        });

    });
});
