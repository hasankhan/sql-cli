var _ = require('underscore'),
    _str = require('underscore.string'),
    Q = require('q'),
    Queries = require('./queries');

_.mixin(_str.exports());

function runQuery(writer, query) {
    var start = new Date().getTime();
    return query().then(function(recordset) {
            var elapsed = new Date().getTime() - start;
            if (!recordset) {
                console.log('OK');
            }
            else {
                writer.write(recordset);
                console.log(_.sprintf('%d row(s) returned in %f ms', recordset.length, elapsed));
                console.log();
            }
        });
}

var QueryCommand = (function () {
    function QueryCommand(db) {
        this.db = db;
    }

    QueryCommand.prototype.run = function (writer, sql) {
        return runQuery(writer, this.db.query.bind(this.db, sql));
    };
    return QueryCommand;
})();

var ListTablesCommand = (function () {
    function ListTablesCommand(db) {
        this.db = db;
        this.prefix = '.tables';
        this.usage = '.tables';
        this.description = 'Lists all the tables';
    }

    ListTablesCommand.prototype.run = function (writer) {
        return runQuery(writer, this.db.query.bind(this.db, Queries.listTablesSql));
    };
    return ListTablesCommand;
})();

var ListDatabasesCommand = (function () {
    function ListDatabasesCommand(db) {
        this.db = db;
        this.prefix = '.databases';
        this.usage = '.databases';
        this.description = 'Lists all the databases';
    }

    ListDatabasesCommand.prototype.run = function (writer) {
        return runQuery(writer, this.db.query.bind(this.db, Queries.listDatabasesSql));
    };
    return ListDatabasesCommand;
})();

var GetSchemaCommand = (function () {
    function GetSchemaCommand(db) {
        this.db = db;
        this.prefix = '.schema';
        this.usage = '.schema TABLE';
        this.description = 'Shows the schema of a table';
    }

    GetSchemaCommand.prototype.run = function (writer, args) {
        if (!args || !Array.isArray(args) || args.length == 0) {
            return Q.reject('Table name not specified');
        }

        var sql = Queries.getSchemaSql;

        var tableName = args[0];
        var i = args[0].indexOf('.');
        var params = [args[0]];
        if (i > -1) {
            tableName = args[0].substring(i+1);
            var schema = args[0].substring(0, i);
            params = [tableName, schema];
            sql += " AND TABLE_SCHEMA = '%s'";
        }

        sql += ' ORDER BY ORDINAL_POSITION';

        return runQuery(writer, this.db.query.bind(this.db, sql, params));
    };
    return GetSchemaCommand;
})();

var QuitCommand = (function () {
    function QuitCommand() {
        this.prefix = '.quit';
        this.usage = '.quit';
        this.description = 'Exit the cli';
    }

    QuitCommand.prototype.run = function () {
        process.exit(0);
    };
    return QuitCommand;
})();

var HelpCommand = (function () {
    function HelpCommand() {
        this.prefix = '.help';
        this.usage = '.help';
        this.description = 'Shows this message';
    }

    HelpCommand.prototype.run = function (writer) {
        var commands = createAll(null, null);
        var doc = commands.map(function(cmd){
            return {
                command: cmd.usage,
                description: cmd.description
            }
        });
        writer.write(doc);

        return Q(); // resolved promise
    };
    return HelpCommand;
})();

function createAll(db) {
    var commands = [
            new HelpCommand(),
            new ListTablesCommand(db),
            new ListDatabasesCommand(db),
            new GetSchemaCommand(db),
            new QuitCommand()
        ];

    return commands;
}

var Invoker = (function () {
    function Invoker(db, writer) {
        this.writer = writer;
        this.commands = createAll(db);

        this.default = new QueryCommand(db);
    }

    Invoker.prototype.run = function (line) {
        var tokens = line.split(' ');

        var cmd = _.findWhere(this.commands, {prefix: tokens[0]});
        if (cmd) {
            return cmd.run(this.writer, tokens.splice(1));
        }
        return this.default.run(this.writer, line);
    };
    return Invoker;
})();

exports.Invoker = Invoker;