var _ = require('underscore'),
    _str = require('underscore.string'),
    Q = require('q'),
    LineByLineReader = require('line-by-line'),
    Queries = require('./queries'),
    exit = require('../external/exit');

_.mixin(_str.exports());

var Utils = (function() {

    function runQuery(messages, writer, query) {
        var start = new Date().getTime();
        return query().then(function(recordsets) {
                var elapsed = new Date().getTime() - start;
                writer.start();
                recordsets.forEach(function(recordset) {
                    if (!recordset) {
                        messages.done();
                    }
                    else {
                        writer.write(recordset);
                        messages.rowCount(recordset.length, writer.appendsLineToResult);
                    }
                });
                writer.end();
                messages.resultsetsEnd(recordsets.length, elapsed);
            });
    }

    function isContinued(line) {
        return line.substring(line.length - 1) == '\\';
    }

    function trimSlash(line) {
        if (!line) return;

        return line.substring(0, line.length-1);
    }

    function appendLine(buffer, line) {
        if (buffer) {
            buffer += '\r\n';
        }
        buffer += line;    
        return buffer;
    }

    return {
        runQuery: runQuery,
        isContinued: isContinued,
        trimSlash: trimSlash,
        appendLine: appendLine
    };
})();

var QueryCommand = (function () {
    function QueryCommand(db) {
        this.db = db;
    }

    QueryCommand.prototype.run = function (messages, writer, sql) {
        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, sql));
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

    ListTablesCommand.prototype.run = function (messages, writer) {
        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listTablesSql()));
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

    ListDatabasesCommand.prototype.run = function (messages, writer) {
        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listDatabasesSql()));
    };
    return ListDatabasesCommand;
})();

var ReadCommand = (function () {
    function ReadCommand(db) {
        this.db = db;
        this.prefix = '.read';
        this.usage = '.read FILENAME';
        this.description = 'Execute commands in a file';
    }
    
    ReadCommand.prototype.run = function (messages, writer, args) {
        if (!validateArgs(args, 1)) {
            return Q.reject('File name not specified');
        }
        
        var deferred = Q.defer(),
            file = args.join(),
            invoker = new Invoker(this.db, messages, writer),
            reader = new LineByLineReader(file),
            last = Q(),
            buffer = '';
            
        reader.on('error', function(err) {
            deferred.reject(err);
        });

        function queueCommand(sql) {
            if (!sql) return;

            last = last.then(function(){
                            messages.echo(sql);
                            return invoker.run(sql);
                       });
        }

        reader.on('line', function (line) {            
            if (Utils.isContinued(line)) {
                line = Utils.trimSlash(line);

                buffer = Utils.appendLine(buffer, line);
            }
            else {
                buffer = Utils.appendLine(buffer, line);

                queueCommand(buffer);
                buffer = '';
            }
        });

        reader.on('end', function() {
            queueCommand(buffer);

            last.then(function(){
                deferred.resolve();
            }, function(err) {
                deferred.reject(err);
            });
        });        
        
        return deferred.promise;
    };
    
    return ReadCommand;
})();

var RunCommand = (function () {
    function RunCommand(db) {
        this.db = db;
        this.prefix = '.run';
        this.usage = '.run FILENAME';
        this.description = 'Execute the file as a sql script';
    }
    
    RunCommand.prototype.run = function (messages, writer, args) {
        if (!validateArgs(args, 1)) {
            return Q.reject('File name not specified');
        }
        
        var deferred = Q.defer(),
            file = args.join(),
            invoker = new Invoker(this.db, messages, writer),
            reader = new LineByLineReader(file),
            last = Q(),
            self = this,
            buffer = '';
            
        reader.on('error', function(err) {
            deferred.reject(err);
        });

        function queueQuery(sql) {
            if (!sql) return;

            last = last.then(function(){                                                                                
                        messages.echo(sql);
                        return Utils.runQuery(messages, writer, self.db.query.bind(self.db, sql));
                    });
        }

        reader.on('line', function (line) {
            if (line.trim() === 'GO') {
                queueQuery(buffer);
                buffer = '';
            }              
            else {            
                buffer = Utils.appendLine(buffer, line);
            }
        });

        reader.on('end', function() {
            queueQuery(buffer);

            last.then(function(){
                deferred.resolve();
            }, function(err) {
                deferred.reject(err);
            });
        });                
        
        return deferred.promise;
    };
    
    return RunCommand;
})();

var GetSchemaCommand = (function () {
    function GetSchemaCommand(db) {
        this.db = db;
        this.prefix = '.schema';
        this.usage = '.schema TABLE';
        this.description = 'Shows the schema of a table';
    }

    GetSchemaCommand.prototype.run = function (messages, writer, args) {
        if (!validateArgs(args, 1)) {
            return Q.reject('Table name not specified');
        }

        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.getSchemaSql(args[0])));
    };
    return GetSchemaCommand;
})();

var ListIndexesCommand = (function () {
    function ListIndexesCommand(db) {
        this.db = db;
        this.prefix = '.indexes';
        this.usage = '.indexes TABLE';
        this.description = 'Lists all the indexes of a table';
    }

    ListIndexesCommand.prototype.run = function (messages, writer, args) {
        if (!validateArgs(args, 1)) {
            return Q.reject('Table name not specified');
        }
        
        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listIndexesSql(args[0])));
    };
    return ListIndexesCommand;
})();

var AnalyzeCommand = (function () {
    function AnalyzeCommand(db) {
        this.db = db;
        this.prefix = '.analyze';
        this.usage = '.analyze';
        this.description = 'Analyzes the database for missing indexes.';
    }

    AnalyzeCommand.prototype.run = function (messages, writer, args) {        
        return Utils.runQuery(messages, writer, this.db.query.bind(this.db, Queries.listMissingIndexesSql()));
    };
    return AnalyzeCommand;
})();

var QuitCommand = (function () {
    function QuitCommand() {
        this.prefix = '.quit';
        this.usage = '.quit';
        this.description = 'Exit the cli';
    }

    QuitCommand.prototype.run = function () {
        exit(0);
        return Q();
    };
    return QuitCommand;
})();

var HelpCommand = (function () {
    function HelpCommand() {
        this.prefix = '.help';
        this.usage = '.help';
        this.description = 'Shows this message';
    }

    HelpCommand.prototype.run = function (messages, writer) {
        var commands = createAll(null, null);
        var doc = commands.map(function(cmd){
            return {
                command: cmd.usage,
                description: cmd.description
            };
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
            new ReadCommand(db),
            new RunCommand(db),
            new GetSchemaCommand(db),
            new ListIndexesCommand(db),
            new AnalyzeCommand(db),
            new QuitCommand()
        ];

    return commands;
}

function validateArgs(args, minCount) {
    return args && Array.isArray(args) && args.length >= minCount;
}

var Invoker = (function () {
    function Invoker(db, messages, writer) {
        this.writer = writer;
        this.messages = messages;
        this.commands = createAll(db);

        this.default = new QueryCommand(db);
    }

    Invoker.prototype.run = function (line) {
        var tokens = line.split(' ');

        var cmd = _.findWhere(this.commands, {prefix: tokens[0]});
        if (cmd) {
            return cmd.run(this.messages, this.writer, tokens.splice(1));
        }
        return this.default.run(this.messages, this.writer, line);
    };
    return Invoker;
})();

exports.Invoker = Invoker;
exports.Utils = Utils;