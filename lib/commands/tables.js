(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries');

    class TablesCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.tables';
            this.usage = '.tables';
            this.description = 'Lists all the tables';
        }

        run(messages, writer) {
            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listTablesSql()));
        }
    }

    module.exports = exports = TablesCommand;

} ());