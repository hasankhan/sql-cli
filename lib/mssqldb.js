(function () {
    "use strict";

    var _ = require('underscore'),
        Q = require('q'),
        _str = require('underscore.string'),
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
                error = err;
                deferred.reject(err);
            });

            request.on('done', function (returnValue) {
                if (!error) {
                    deferred.resolve(resultsets);
                }
            });

            sql = _str.trim(sql);
            request.query(sql);

            return deferred.promise;
        }

    }

    module.exports = exports = MSSQLDbService;
} ());