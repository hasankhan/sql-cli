(function () {
    "use strict";

    var _ = require('underscore'),
        Q = require('q'),
        mssql = require('mssql');

    class MSSQLDbService {

        constructor() {
        }

        connect(config) {
            return new Q(mssql).ninvoke("connect", config);
        }

        query(sql) {
            var self = this,
                deferred = Q.defer();

            var request = new mssql.Request();
            request.stream = true;

            var resultsets = [];
            var error = null;
            var resultset = null;

            request.on('recordset', function (recordset) {
                resultset = [];
                resultsets.push(resultset);
            });

            request.on('row', function (row) {
                resultset.push(row);
            });

            request.on('error', function (err) {
                deferred.reject(err);
            });

            request.on('done', function (returnValue) {
                deferred.resolve(resultsets);
            });

            request.query(sql, function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

    }

    module.exports = exports = MSSQLDbService;
} ());