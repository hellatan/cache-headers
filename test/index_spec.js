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

describe('cache control middleware', function() {

    let app;
    let router;
    let agent;

    beforeEach(function () {
        router = express.Router();
        router.use(cacheControl.middleware(caches));
        app = express();
        app.use(router);
        agent = supertest(app);
    });

    describe('path object', () => {
        it('should set the cache header if an object is passed into the path', (done) => {
            agent
                .get('/obj')
                .expect('Cache-Control', 'max-age=10')
                .end(done);
        });

        it('should set the default cache header if invalid object settings are passed in', (done) => {
            agent
                .get('/obj', cacheControl.middleware({
                    paths: {
                        '/obj': { notValid: 10 }
                    }
                }))
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
            .expect('Cache-Control', 'max-age=0, no-cache')
            .end(done);
    });

    it('sets cache control to the passed string if specified in config file', function (done) {
        agent
            .get('/root/sub')
            .expect('Cache-Control', 'private, max-age=300')
            .end(done);
    });

    it('sets cache control to the passed string if specified in config file', function (done) {
        agent
            .get('/root/other', cacheControl.middleware({
                cacheSettings: {
                    maxAge: 100
                }
            }))
            .expect('Cache-Control', 'max-age=100')
            .end(done);
    });

    it('sets cache control to 600 seconds by default', function(done) {
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

    it.only('should overwrite default cache settings', (done) => {
        agent
            .get('/test/subpath', cacheControl.middleware({
                paths: {
                    '/test/subpath': {
                        'maxAge': "3000"
                    }
                }
            }))
            .expect('Cache-Control', 'max-age=3000, s-maxage=3000')
            .end(done);
    });

    it('sets cache control using glob negation', function (done) {
        app = express()
            .use(cacheControl.middleware({
                paths:{
                    '!/anything/**': false
                }
            }));

        async.parallel([
            function (cb) {
                agent
                    .get('/negation')
                    .expect('Cache-Control', 'max-age=0, no-cache')
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
