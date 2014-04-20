var program = require( 'commander' ),
    colors = require( 'colors' ),
    sql = require( 'mssql' ),
    prompt = require( 'prompt' ),
    Table = require( 'easy-table' );

program.version( '0.0.1' )
    .option( '-s, --server [server]', 'Server to conect to' )
    .option( '-u, --user [user]', 'User name to use for authentication' )
    .option( '-p, --pass [pass]', 'Password to use for authentication' )
    .option( '-o, --port [port]', 'Port to connect to' )
    .option( '-t, --timeout [timeout]', 'Connection timeout in ms' )
    .option( '-d, --database [database]', 'Database to connect to' );

var SqlCli = function () {
    function SqlCli() {
        this.commands = {
            'quit': this._exit.bind(this),
            '.tables': this._listTables.bind(this),
            '.databases': this._listDatabases.bind(this),
        }
    };

    SqlCli.prototype.run = function ( argv ) {
        var self = this;

        prompt.start();
        prompt.message = '';
        prompt.delimiter = '';

        process.on('SIGINT', self._exit.bind(self));

        program.parse( argv );
        process.stdout.write('Connecting ' + program.server + '...');

        var config = {
            user: program.user,
            password: program.pass,
            server: program.server,
            database: program.database,
            port: program.port,
            timeout: program.timeout
        };

        sql.connect(config, function ( err ) {
            self._onErrorExit( err );
            console.log('done');

            process.nextTick(self._prompt.bind( self) );
        });
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
        console.log( err.toString().red );
    };

    SqlCli.prototype._prompt = function () {
        var self = this;

        prompt.get( ['>'], function ( err, result ) {
            if ( err ) {
                return self._onErrorNext(err);
            }

            var cmd = result['>'];
            if (!cmd) {
                self._nextPrompt();
                return;
            }

            var handler = self.commands[cmd];
            if (handler) {
                handler();
            }
            else {
                self._query(cmd);
            }           
        });
    };

    SqlCli.prototype._nextPrompt = function () {
        process.nextTick(this._prompt.bind(this) );
    };

    SqlCli.prototype._query = function(cmd) {
        var self = this;

        var request = new sql.Request();
            request.query(cmd, function ( err, recordset ) {
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
        this._query('SELECT * FROM information_schema.tables');
    };

    SqlCli.prototype._listDatabases = function() {
        this._query('EXEC sp_databases');
    };

    return SqlCli;
} ();

module.exports = exports = SqlCli;