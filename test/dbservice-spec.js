var proxyquire =  require('proxyquire').noPreserveCache();

describe('DbService', function() {
    var mssql, service;

    function setup() {
        mssql = {};
        var DbService = proxyquire('../lib/dbservice', { 'mssql': mssql });
        service = new DbService();        
    }

    describe('connect', function() {
        beforeEach(function() {
           setup(); 
        });
        
        it('connects to sql on connect', function(done) {
            mssql.connect = function (config, callback) { callback(); };

            service.connect()
                    .then(done)
                    .fail(done);
        });
    });

    describe('query', function() {
        beforeEach(function() {
           setup(); 
        });

        it('formats and concats the args', function(done) {
            var Request = mssql.Request = function(){};
            Request.prototype.on = jasmine.createSpy();
            Request.prototype.query = function (query, callback) { callback ( null, [{colA: 'theValue'}]); };
            spyOn(Request.prototype, 'query').andCallThrough();

            service.query('%s are %d tests', ['there', 123])
                   .then(function(results){
                        expect(results.length).toBe(1);
                        expect(results[0].colA).toBe('theValue');
                        expect(Request.prototype.on).toHaveBeenCalledWith('done', jasmine.any(Function));                    
                        expect(Request.prototype.on).toHaveBeenCalledWith('resultset', jasmine.any(Function));                        
                        expect(Request.prototype.on).toHaveBeenCalledWith('error', jasmine.any(Function));
                        expect(Request.prototype.query).toHaveBeenCalledWith('there are 123 tests', jasmine.any(Function));
                        done();
                   }).fail(done);
        });
    });
});