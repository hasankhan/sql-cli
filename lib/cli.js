var program = require('commander'),
    _ = require('underscore'),
    _str = require('underscore.string'),
    colors = require('colors'),
    readline = require('readline'),
    Table = require('easy-table'),    
    pjson = require('../package.json'),
	DbService = require('./dbservice.js'),
	Queries = require('./queries.js');

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
    .option( '-e, --encrypt', 'Enable encryption' );

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
    }

    SqlCli.prototype.run = function ( argv ) {
        // parse arguments
        program.parse( argv );
        program.server = program.server || 'localhost'

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
			   .then(this._onConnect.bind(this), this._onErrorExit.bind(this));
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

        // initialize prompt
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        this.rl.setPrompt('mssql> ');
        this.rl.prompt();
        this.rl.on('line', this._runCommand.bind(this));

        this._nextPrompt();
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
            this._nextPrompt(-1);
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
            this._nextPrompt();
            return;
        }

        var tokens = line.split(' ');

        this.exit = exit;
        var cmd = this.commands[tokens[0]];
        if (cmd) {
            cmd.handler(tokens.splice(1));
        }
        else {
            this._query(line);
        }
    };

    SqlCli.prototype._nextPrompt = function (code) {
        if (this.exit) {
            code = code === undefined ? 0: code;
            this._exit(code);
        }
        else {
            process.nextTick(this.rl.prompt.bind(this.rl));
        }
    };

    SqlCli.prototype._query = function(cmd, args) {
        var self = this;

        var start = new Date().getTime();
		this.db.query(cmd, args)
				.then(function(recordset) {
					var elapsed = new Date().getTime() - start;
					
					if (!recordset) {
						console.log('OK');
					}
					else {
						console.log(Table.printArray( recordset ));
						console.log(_.sprintf('%d row(s) returned in %f ms', recordset.length, elapsed));
						console.log();
					}

					self._nextPrompt();
				}, self._onErrorNext.bind(self));
    };

    SqlCli.prototype._listTables = function() {
        this._query(Queries.listTablesSql);
    };

    SqlCli.prototype._listDatabases = function() {
        this._query(Queries.listDatabasesSql);
    };

    SqlCli.prototype._help = function() {
        var self = this;

        var doc = _.values(self.commands).map(function(meta){
            return {
                command: meta.usage,
                description: meta.description
            }
        });
        console.log(Table.printArray(doc));

        self._nextPrompt();
    };

    SqlCli.prototype._getSchema = function(args) {
        if (!args || !Array.isArray(args) || args.length == 0) {
            return this._onErrorNext('Table name not specified');
        }

        var sql = Queries.getSchemaSql;
		
        var tableName = args[0];
        var schema = null;
        var i = args[0].indexOf('.');
        var params = [tableName];
        if (i > -1) {
            tableName = args[0].substring(i+1);
            schema = args[0].substring(0, i);
            params = [tableName, schema];
            sql += " AND TABLE_SCHEMA = '%s'";
        }

        sql += ' ORDER BY ORDINAL_POSITION';

        this._query(sql, params);
    };

    return SqlCli;
} ();

module.exports = exports = SqlCli;