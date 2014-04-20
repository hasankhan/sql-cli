var program = require( 'commander' ),
    _ = require('underscore'),
    _str = require('underscore.string'),
    colors = require( 'colors' ),
    mssql = require( 'mssql' ),
    prompt = require( 'prompt' ),   
    Table = require( 'easy-table' );

_.mixin(_str.exports());

program.version( '0.0.6' )
    .option( '-s, --server [server]', 'Server to conect to' )
    .option( '-u, --user [user]', 'User name to use for authentication' )
    .option( '-p, --pass [pass]', 'Password to use for authentication' )
    .option( '-o, --port [port]', 'Port to connect to' )
    .option( '-t, --timeout [timeout]', 'Connection timeout in ms' )
    .option( '-d, --database [database]', 'Database to connect to' )
    .option( '-v, --tdsVersion [tdsVersion]', 'Version of tds protocol to use' )
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
    };

    SqlCli.prototype.run = function ( argv ) {
        var self = this;

        // initialize prompt
        prompt.start();
        prompt.message = 'mssql';
        prompt.delimiter = '';
        
        // parse arguments
        program.parse( argv );
        program.server = program.server || 'localhost'
                
        process.stdout.write('Connecting to ' + program.server + '...');

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

        mssql.connect(config, self._onConnect.bind(self));
    };
    
    SqlCli.prototype._onConnect = function ( err ) {
        this._onErrorExit( err );
        console.log('done');
        console.log();
        console.log('sql-cli version ' + program.version());
        console.log('Enter ".help" for usage hints.');

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
            this._nextPrompt();
        }
    };

    SqlCli.prototype._logError = function ( err ) {
        console.error( err.toString().red );
    };

    SqlCli.prototype._prompt = function () {
        var self = this;

        prompt.get( ['>'], function ( err, result ) {
            if ( err ) {
                return self._onErrorNext(err);
            }

            var line = result['>'];
            if (!line) {
                self._nextPrompt();
                return;
            }
            
            var tokens = line.split(' ');

            var cmd = self.commands[tokens[0]];
            if (cmd) {
                cmd.handler(tokens.splice(1));
            }
            else {
                self._query(line);
            }           
        });
    };

    SqlCli.prototype._nextPrompt = function () {
        process.nextTick(this._prompt.bind(this) );
    };

    SqlCli.prototype._query = function(cmd, args) {
        var self = this;
        
        args = args || [];
        args.unshift(cmd);
        var sql = _.sprintf.apply(null, args);
        
        var request = new mssql.Request();
            request.query(sql, function ( err, recordset ) {
                if ( err ) {
                    return self._onErrorNext(err);
                }
                
                if (!recordset) {
                    console.log('OK');
                }
                else {
                    console.log(Table.printArray( recordset ));
                }
                self._nextPrompt();
            });
    };

    SqlCli.prototype._listTables = function() {
        this._query('SELECT * FROM INFORMATION_SCHEMA.TABLES');
    };

    SqlCli.prototype._listDatabases = function() {
        this._query('SELECT name FROM sys.databases');
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
        
        var sql = "SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, DATA_TYPE TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '%s'";
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