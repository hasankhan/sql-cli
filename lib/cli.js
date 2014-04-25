var program = require('commander'),
    _ = require('underscore'),
    _str = require('underscore.string'),
    colors = require('colors'),
    pjson = require('../package.json'),
    Prompt = require('./prompt');
    DbService = require('./dbservice');
    ResultWriter = require('./resultwriter');

_.mixin(_str.exports());

program.version( pjson.version )
    .option( '-s, --server <server>', 'Server to conect to' )
    .option( '-u, --user <user>', 'User name to use for authentication' )
    .option( '-p, --pass <pass>', 'Password to use for authentication' )
    .option( '-o, --port <port>', 'Port to connect to' )
    .option( '-t, --timeout <timeout>', 'Connection timeout in ms' )
    .option( '-d, --database <database>', 'Database to connect to' )
    .option( '-q, --query <query>', 'The query to execute' )
    .option( '-v, --tdsVersion <tdsVersion>', 'Version of tds protocol to use' )
    .option( '-e, --encrypt', 'Enable encryption' )
    .option( '-f, --format <format>', 'The format of output i.e. (csv, table)');

var SqlCli = function () {
    function SqlCli() {
        this.commands = {
            '.help': {handler: this._help.bind(this), description: 'Shows this message', usage: '.help' },
            '.tables': {handler: this._listTables.bind(this), description: 'Lists all the tables', usage: '.tables'},
            '.schema': {handler: this._getSchema.bind(this), description: 'Shows the schema of a table', usage: '.schema TABLE'},
            '.databases': {handler: this._listDatabases.bind(this), description: 'Lists all the databases', usage: '.databases'},
            '.quit': {handler: this._exit.bind(this), description: 'Exit the cli', usage: '.quit' }
        }

        this.db = new DbService();

        this.prompt = new Prompt();
        this.prompt.on('line', this._runCommand.bind(this));
        this.prompt.on('end', this._exit.bind(this));
    }

    SqlCli.prototype.run = function ( argv ) {
        // parse arguments
        program.parse( argv );
        program.server = program.server || 'localhost';
        this._createWriter(program.format);

        if (!program.query) {
            process.stdout.write('Connecting to ' + program.server + '...');
        }

        var config = {
            user: program.user,
            password: program.pass,
            server: program.server,
            database: program.database,
            port: program.port,
            timeout: program.timeout,
            options: {
                tdsVersion: program.tdsVersion,
                encrypt: program.encrypt
            }
        };

        this.db.connect(config)
               .then(this._onConnect.bind(this),
                     this._onErrorExit.bind(this));
    };

    SqlCli.prototype._createWriter = function (format) {
        try {
            this.writer = ResultWriter.create(format);
        }
        catch (e) {
            this._onErrorExit(e.message);
        }
    };

    SqlCli.prototype._onConnect = function () {
        if (program.query) {
            this._runCommand(program.query, true);
            return;
        }

        console.log('done');
        console.log();
        console.log('sql-cli version ' + program.version());
        console.log('Enter ".help" for usage hints.');

        this.prompt.next();
    };

    SqlCli.prototype._exit = function (code) {
        process.exit(code);
    };

    SqlCli.prototype._onErrorExit = function ( err ) {
        if ( err ) {
            this._logError( err );
            this._exit(-1);
        }
    };

    SqlCli.prototype._onErrorNext = function ( err ) {
        if ( err ) {
            this._logError( err );
            this.prompt.next(-1);
        }
    };

    SqlCli.prototype._logError = function ( err ) {
        var message = null;
        if (err instanceof Error && err.message) {
            message = err.message;
        }
        else if (err) {
            message = err.toString()
        }
        message = message || 'Unexpected error'
        console.error( _.sprintf('Error: %s', message ).grey);
    };

    SqlCli.prototype._runCommand = function (line, exit) {
        if (!line) {
            this.prompt.next();
            return;
        }

        var tokens = line.split(' ');

        this.prompt.exit = exit;
        var cmd = this.commands[tokens[0]];
        if (cmd) {
            cmd.handler(tokens.splice(1));
        }
        else {
            this._query(this.db.query.bind(this.db, line));
        }
    };

    SqlCli.prototype._query = function(query) {
        var self = this;

        var start = new Date().getTime();
        query().then(function(recordset) {
                    var elapsed = new Date().getTime() - start;
                    if (!recordset) {
                        console.log('OK');
                    }
                    else {
                        self.writer.write(recordset);
                        console.log(_.sprintf('%d row(s) returned in %f ms', recordset.length, elapsed));
                        console.log();
                    }

                    self.prompt.next();
                }, self._onErrorNext.bind(self));
    };

    SqlCli.prototype._listTables = function() {
        this._query(this.db.listTables.bind(this.db));
    };

    SqlCli.prototype._listDatabases = function() {
        this._query(this.db.listDatabases.bind(this.db));
    };

    SqlCli.prototype._getSchema = function(args) {
        if (!args || !Array.isArray(args) || args.length == 0) {
            return this._onErrorNext('Table name not specified');
        }

        this._query(this.db.getSchema.bind(this.db, args[0]));
    };

    SqlCli.prototype._help = function() {
        var doc = _.values(this.commands).map(function(meta){
            return {
                command: meta.usage,
                description: meta.description
            }
        });
        this.writer.write(doc);
        this.prompt.next();
    };

    return SqlCli;
} ();

module.exports = exports = SqlCli;