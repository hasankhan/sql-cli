var proxyquire =  require('proxyquire');

describe('DbService', function() {
    var mssql, service;
    
    beforeEach(function() {
        mssql = {};
        var DbService = proxyquire('../lib/dbservice', { 'mssql': mssql });
        service = new DbService();
    });
    
    describe('connect', function() {
        it('connects to sql on connect', function(done) {
            mssql.connect = function (config, callback) { callback(); };
            
            service.connect()
                    .then(done)
                    .fail(done);
        });
    });    
    
    describe('query', function() {
        it('formats and concats the args', function(done) {
            var Request = mssql.Request = function(){};
            Request.prototype.query = function (query, callback) { callback ( null, [{colA: 'theValue'}]); };
            spyOn(Request.prototype, 'query').andCallThrough();
            
            service.query('%s are %d tests', ['there', 123])
                   .then(function(results){
                        expect(results.length).toBe(1);
                        expect(results[0].colA).toBe('theValue');
                        expect(Request.prototype.query).toHaveBeenCalledWith('there are 123 tests', jasmine.any(Function));
                        done();
                   }).fail(done);
        });
    });
});