(function () {
    "use strict";

    var Utils = require('./utils'),
        Queries = require('./queries'),
        Q = require('q');

    class SearchCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.search';
            this.usage = '.search TYPE VALUE';
            this.description = 'Searches for a value of specific type (col|text)';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('No search type supplied');
            }
            if (!Utils.validateArgs(args, 2)) {
                return Q.reject('No search value supplied');
            }
            messages.echo('Searching...');

            if (args[0] == 'col') {
                return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.getColumnsSql(args[1])));
            }
            return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.searchSql(args[1])));
        }
    }

    module.exports = exports = SearchCommand;

} ());
