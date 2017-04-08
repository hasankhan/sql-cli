(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries'),
        Q = require('q');

    class GetSchemaCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.schema';
            this.usage = '.schema TABLE';
            this.description = 'Shows the schema of a table';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('Table name not specified');
            }

            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.getSchemaSql(args[0])));
        }
    }

    module.exports = exports = GetSchemaCommand;

} ());
