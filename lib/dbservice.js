var _ = require('underscore'),
    _str = require('underscore.string'),
    Q = require('q'),
    mssql = require('mssql');

_.mixin(_str.exports());

var DbService = (function () {

    var DbService = function() {
    };

    DbService.prototype.connect = function(config) {
        return Q.nfcall(mssql.connect.bind(mssql), config);
    };

    DbService.prototype.query = function(cmd, args) {
        var self = this,
            deferred = Q.defer();

        args = args || [];
        args.unshift(cmd);
        var sql = _.sprintf.apply(null, args);

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