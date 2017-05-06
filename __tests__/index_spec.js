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
import request from 'supertest';

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

function createServer(app) {
    // create a fresh instance between tests cases
    return app.listen(0);
}

/**
 *
 * @param {array<object>} overrides
 * @param {string} overrides[].route The string to check against
 * @param {array} overrides[].middlewares Array of middlewares to pass into the route
 * @param {string} route The route to check against
 * @returns {Array}
 */
function getOverrideRouteMiddleware(overrides = [], route) {
    const routeOverride = overrides.filter(override => (override.route === route));
    if (routeOverride.length) {
        return routeOverride[0].middlewares;
    }
    return [];
}

/**
 *
 * @param {object} app Your app instance
 * @param {array<object>} [overrides] Array of objects to override any routes, used for adding custom middlewares
 * @param {string} overrides[].route The string to check against
 * @param {array} overrides[].middlewares Array of middlewares to pass into the route
 *      [
 *          {
 *              route: '/root/sub',
 *              middlewares; [...]
 *          }
 *      ]
 * @returns {*}
 */
function createMockRoutes(app, overrides) {
    const routes = [
        '/root/sub/subpath',
        '/root/sub',
        '/root/*',
        '/root',
        '/obj',
        '/'
    ];

    routes.forEach(route => {
        const middlewares = [].concat(getOverrideRouteMiddleware(overrides, route));
        app.get(route, middlewares, (req, res) => {
            res.status(200).send('ok');
        });
    });
}

function testHeaders(res, testCases) {
    testCases.forEach(obj => {
        // all headers are lowercased in the response object
        expect(res.header[obj.name.toLowerCase()]).toBe(obj.value);
    });
}

describe('cache control index', function () {

    let server;

    afterEach(done => {
        if (server && server.close) {
            server.close(done);
        } else {
            done();
        }
    });

    it('should have default cache time values', function () {
        // make sure default cache values are attached to public api
        Object.keys(timeValues).forEach(val => {
            assert(api[val] === timeValues[val]);
        });
    });

    describe('application-level middleware', function () {

        describe('initial paths', function () {
            let agent;
            let app;
            beforeEach(() => {
                app = express();
                app.use(api.middleware(caches));
                createMockRoutes(app);
                server = createServer(app);
                agent = request(server);
            });
            it('should get a nested path', (done) => {
                agent.get('/root/sub/subpath')
                    .end((err, res) => {
                        // it seems like the `.expect(headerName, headerValue)` api does not assert properly
                        // this is the only consistent way to get tests to assert properly
                        const expectedHeaders = [
                            {name: HEADER_CACHE_CONTROL, value: NO_CACHE_NO_STORE},
                            {name: HEADER_SURROGATE_CONTROL, value: 'max-age=31536000'},
                            {name: HEADER_PRAGMA, value: 'no-cache'},
                            {name: HEADER_EXPIRES, value: '0'}
                        ];
                        testHeaders(res, expectedHeaders);
                        done();
                    });
            });
            it('should get an exact match', function (done) {
                const cacheControlValue = `${NO_CACHE_NO_STORE}, stale-while-revalidate=400, stale-if-error=600`;
                agent.get('/root/sub')
                    .end((err, res) => {
                        const expectedHeaders = [
                            {name: HEADER_CACHE_CONTROL, value: cacheControlValue},
                            {name: HEADER_SURROGATE_CONTROL, value: 'max-age=300'}
                        ];
                        testHeaders(res, expectedHeaders);
                        done();
                    });
            });
            it('should get any match', function (done) {
                agent.get('/root/something/subbby')
                    .end((err, res) => {
                        const expectedHeaders = [
                            {name: HEADER_CACHE_CONTROL, value: `private, ${NO_CACHE_NO_STORE}`},
                            {name: HEADER_SURROGATE_CONTROL, value: 'max-age=0'}
                        ];
                        testHeaders(res, expectedHeaders);
                        done();
                    });
            });
        });

        it('should override default cache settings', (done) => {
            const override = [
                {
                    route: '/root/sub',
                    middlewares: [
                        api.middleware({
                            cacheSettings: {
                                maxAge: 9999999999
                            }
                        })
                    ]
                }
            ];
            const app = express();
            app.use(api.middleware(caches));
            createMockRoutes(app, override);

            server = createServer(app);
            request(server).get('/root/sub')
                .end((err, res) => {
                    const expectedHeaders = [
                        {name: HEADER_CACHE_CONTROL, value: NO_CACHE_NO_STORE},
                        {name: HEADER_SURROGATE_CONTROL, value: 'max-age=9999999999'},
                        {name: 'Pragma', value: 'no-cache'},
                        {name: 'Expires', value: '0'}
                    ];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

        it('should set default values when nothing is passed in', (done) => {
            const app = express();
            app.use(api.middleware());
            // setup only one route
            app.get('/root/sub', (req, res) => {
                res.status(200).send('ok');
            });
            server = createServer(app);
            request(server).get('/root/sub')
                .end((err, res) => {
                    const expectedHeaders = [
                        {name: HEADER_CACHE_CONTROL, value: NO_CACHE_NO_STORE},
                        {name: HEADER_SURROGATE_CONTROL, value: 'max-age=600'},
                        {name: 'Pragma', value: 'no-cache'},
                        {name: 'Expires', value: '0'}
                    ];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

    });

    describe('router-level middleware', function () {

        let app;
        let router;

        beforeEach(function () {
            app = express();
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
                server = createServer(app);
                request(server).get('/obj')
                    .end((err, res) => {
                        const expectedHeaders = [
                            {name: HEADER_CACHE_CONTROL, value: "no-cache, no-store, must-revalidate"},
                            {name: HEADER_SURROGATE_CONTROL, value: 'max-age=600'}
                        ];
                        testHeaders(res, expectedHeaders);
                        done();
                    });
            });
        });

        it('sets surrogate control to the passed string if specified in route-specific config file', function (done) {
            router.get('/root/other', api.middleware({
                cacheSettings: {
                    [KEY_SURROGATE_CONTROL]: 100
                }
            }));
            server = createServer(app);
            request(server).get('/root/other')
                .end((err, res) => {
                    const expectedHeaders = [{name: HEADER_SURROGATE_CONTROL, value: 'max-age=100'}];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

        it('sets surrogate control to 600 seconds by default', function (done) {
            server = createServer(app);
            request(server).get('/')
                .end((err, res) => {
                    const expectedHeaders = [{name: HEADER_SURROGATE_CONTROL, value: 'max-age=600'}];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

        it('sets the surrogate control to 600 seconds by default if no config is provided', function (done) {
            app = express();
            router = express.Router(); // eslint-disable-line new-cap
            router.use(api.middleware(caches));
            app.use(router);
            server = createServer(app);
            request(server).get('/')
                .end((err, res) => {
                    const expectedHeaders = [{name: HEADER_SURROGATE_CONTROL, value: 'max-age=600'}];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

        it('should overwrite default cache settings', (done) => {
            router.get('/test/subpath', api.middleware({
                cacheSettings: {
                    [KEY_SURROGATE_CONTROL]: "3000"
                }
            }));
            server = createServer(app);
            request(server).get('/test/subpath')
                .end((err, res) => {
                    const expectedHeaders = [{name: HEADER_SURROGATE_CONTROL, value: 'max-age=3000'}];
                    testHeaders(res, expectedHeaders);
                    done();
                });
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
            server = createServer(app);
            const agent = request(server);

            agent.get('/negation')
                .end((err, res) => {
                    const expectedHeaders = [
                        {name: HEADER_CACHE_CONTROL, value: "private, no-cache, no-store, must-revalidate"},
                        {name: HEADER_SURROGATE_CONTROL, value: 'max-age=0'}
                    ];
                    testHeaders(res, expectedHeaders);
                });
            agent.get('/anything/test.html')
                .end((err, res) => {
                    const expectedHeaders = [
                        {name: HEADER_CACHE_CONTROL, value: 'no-cache, no-store, must-revalidate'},
                        {name: HEADER_SURROGATE_CONTROL, value: 'max-age=600'}
                    ];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });

    });

    describe('setAdditionalHeaders', function () {
        let app;
        it("should set headers passed in", (done) => {
            const additionalHeaders = [
                {
                    'custom-header': 'yes',
                    'another-header': 100
                },
                {
                    name: 'set-by-name',
                    value: 'set by value'
                }
            ];

            app = express();
            app.use(api.setAdditionalHeaders(additionalHeaders));
            createMockRoutes(app);
            server = createServer(app);
            request(server).get('/')
                .end((err, res) => {
                    const expectedHeaders = [
                        {name: 'custom-header', value: 'yes'},
                        {name: 'another-header', value: '100'},
                        {name: 'set-by-name', value: 'set by value'}
                    ];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });
        it('should use the default empty array when nothing is passed in', (done) => {
            app = express();
            app.use(api.setAdditionalHeaders());
            server = createServer(app);
            request(server).get('/')
                .end((err, res) => {
                    const expectedHeaders = [];
                    testHeaders(res, expectedHeaders);
                    done();
                });
        });
    });
});
