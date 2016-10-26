(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries');

    class DatabasesCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.databases';
            this.usage = '.databases';
            this.description = 'Lists all the databases';
        }

        run(messages, writer) {
            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listDatabasesSql()));
        }
    }

    module.exports = exports = DatabasesCommand;

} ());