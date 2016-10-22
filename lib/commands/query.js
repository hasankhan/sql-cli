(function () {
    "use strict";

    var Utils = require('./utils');

    class QueryCommand {
        constructor(db) {
            this.db = db;
        }

        run(messages, writer, sql) {
            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, sql));
        }
    }

    module.exports = exports = QueryCommand;

} ());