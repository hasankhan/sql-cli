(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries');

    class AnalyzeCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.analyze';
            this.usage = '.analyze';
            this.description = 'Analyzes the database for missing indexes.';
        }

        run(messages, writer, args) {
            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listMissingIndexesSql()));
        }
    }

    module.exports = exports = AnalyzeCommand;
} ());