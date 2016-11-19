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
            this.connection = new mssql.Connection(config);
            return this.connection.connect();
        }

        query(sql) {
            var self = this,
                deferred = Q.defer();

            var request = new mssql.Request(this.connection);
            request.stream = true;
            request.multiple = true;

            var resultsets = [];
            var error = null;
            var resultset = null;

            request.on('recordset', recordset => {
                resultset = [];
                resultsets.push(resultset);
            });

            request.on('row', row => {
                resultset.push(row);
            });

            request.on('error', err => {
                error = err;
                deferred.reject(err);
            });

            request.on('done', returnValue => {
                if (!error) {
                    deferred.resolve(resultsets);
                }
            });

            sql = _str.trim(sql);
            request.batch(sql);

            return deferred.promise;
        }

    }

    module.exports = exports = MSSQLDbService;
} ());