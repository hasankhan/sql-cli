(function () {
    "use strict";

    var proxyquire = require('proxyquire').noPreserveCache(),
        _ = require('underscore'),
        Q = require('q');

    describe('MSSQLDbService', () => {
        var mssql, service;

        function setup() {
            mssql = {};
            var MSSQLDbService = proxyquire('../lib/mssqldb', { 'mssql': mssql });
            service = new MSSQLDbService();
        }

        describe('connect', () => {
            beforeEach(() => {
                setup();
            });

            it('connects to sql on connect', done => {
                mssql.Connection = class {
                    connect(config) {
                        return new Q();
                    }
                };

                service.connect()
                    .then(done)
                    .catch(done);
            });
        });

        describe('query', () => {
            beforeEach(() => {
                setup();
            });

            it('executes the query', () => {
                var Request = mssql.Request = class { };
                Request.prototype.on = jasmine.createSpy();
                Request.prototype.batch = jasmine.createSpy();
                var query = 'there are 123 tests';
                var request = service.query(query);
                expect(request.batch).toHaveBeenCalledWith(query);
                expect(request.stream).toEqual(true);
                expect(request.multiple).toEqual(true);
            });
        });
    });"use strict";

    var proxyquire = require('proxyquire').noPreserveCache(),
        _ = require('underscore'),
        Q = require('q');

    describe('MSSQLDbService', () => {
        var mssql, service;

        function setup() {
            mssql = {};
            var MSSQLDbService = proxyquire('../lib/mssqldb', { 'mssql': mssql });
            service = new MSSQLDbService();
        }

        describe('connect', () => {
            beforeEach(() => {
                setup();
            });

            it('connects to sql on connect', done => {
                mssql.Connection = class {
                    connect(config) {
                        return new Q();
                    }
                };

                service.connect()
                    .then(done)
                    .catch(done);
            });
        });

        describe('query', () => {
            beforeEach(() => {
                setup();
            });

            it('executes the query', () => {
                var Request = mssql.Request = class { };
                Request.prototype.on = jasmine.createSpy();
                Request.prototype.batch = jasmine.createSpy();
                var query = 'there are 123 tests';
                var request = service.query(query);
                expect(request.batch).toHaveBeenCalledWith(query);
                expect(request.stream).toEqual(true);
                expect(request.multiple).toEqual(true);
            });
        });
    });

} ());