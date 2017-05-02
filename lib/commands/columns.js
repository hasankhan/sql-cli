(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries'),
        Q = require('q');

    class GetColumnCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.column';
            this.usage = '.column COLUMN';
            this.description = 'Search tables for column';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('Column name not specified');
            }

            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.getColumnsSql(args[0])));
        }
    }

    module.exports = exports = GetColumnCommand;

} ());
