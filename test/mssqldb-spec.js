(() => {
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

            it('executes the query', done => {
                var Request = mssql.Request = class { };
                Request.prototype.on = jasmine.createSpy();
                Request.prototype.batch = jasmine.createSpy();

                service.query('there are 123 tests')
                    .then(results => {
                        expect(results.length).toBe(1);
                        expect(results[0][0].colA).toBe('theValue');
                        expect(Request.prototype.on).toHaveBeenCalledWith('done', jasmine.any(Function));
                        expect(Request.prototype.on).toHaveBeenCalledWith('recordset', jasmine.any(Function));
                        expect(Request.prototype.on).toHaveBeenCalledWith('row', jasmine.any(Function));
                        expect(Request.prototype.on).toHaveBeenCalledWith('error', jasmine.any(Function));
                        expect(Request.prototype.batch).toHaveBeenCalledWith('there are 123 tests');
                        done();
                    }).catch(done);

                var recordsetCallback = _.find(Request.prototype.on.argsForCall, args => { return args[0] == 'recordset'; })[1];
                recordsetCallback();

                var rowCallback = _.find(Request.prototype.on.argsForCall, args => { return args[0] == 'row'; })[1];
                rowCallback({ colA: 'theValue' });

                var doneCallback = _.find(Request.prototype.on.argsForCall, args => { return args[0] == 'done'; })[1];
                doneCallback();
            });
        });
    });

} ());