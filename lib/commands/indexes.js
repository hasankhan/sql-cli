(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q'),
        Queries = require('./queries');

    class IndexesCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.indexes';
            this.usage = '.indexes TABLE';
            this.description = 'Lists all the indexes of a table';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('Table name not specified');
            }

            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listIndexesSql(args[0])));
        }
    }

    module.exports = exports = IndexesCommand;

} ());