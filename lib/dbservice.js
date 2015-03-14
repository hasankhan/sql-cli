var _ = require('underscore'),
    Q = require('q'),
    mssql = require('mssql');

var DbService = (function () {

    var DbService = function() {
    };

    DbService.prototype.connect = function(config) {
        return Q.nfcall(mssql.connect.bind(mssql), config);
    };

    DbService.prototype.query = function(sql) {
        var self = this,
            deferred = Q.defer();

        var request = new mssql.Request();
        request.stream = true;

        var resultsets = [];
        var error = null;

        request.on('recordset', function(resultset) {
            resultsets.push(resultset);
        });

        request.on('error', function(err) {
            deferred.reject(err);
        });

        request.on('done', function(returnValue) {
            deferred.resolve(resultsets);
        });

        request.query(sql, function(err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };

    return DbService;
})();

module.exports = exports = DbService;