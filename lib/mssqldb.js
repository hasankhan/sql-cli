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
            var request = new mssql.Request(this.connection);
            request.stream = true;
            request.multiple = true;

            sql = _str.trim(sql);
            request.batch(sql);

            return request;
        }

    }

    module.exports = exports = MSSQLDbService;
} ());