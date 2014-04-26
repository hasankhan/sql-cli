var program = require('commander'),
    _ = require('underscore'),
    _str = require('underscore.string'),
    pjson = require('../package.json'),
    Prompt = require('./prompt');
    DbService = require('./dbservice'),
    Invoker = require('./commands').Invoker,
    ResultWriter = require('./resultwriter'),
    Messages = require('./messages'),
    exit = require('./exit');

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
    .option( '-f, --format <format>', 'The format of output [csv, table, xml, json]');

var SqlCli = (function () {
    function SqlCli() {
        this.db = new DbService();
        this.messages = new Messages();
        this.prompt = new Prompt();
        this.prompt.on('line', this._runCommand.bind(this));
        this.prompt.on('end', exit.bind(null));
    }

    SqlCli.prototype.run = function ( argv ) {
        // parse arguments
        program.parse( argv );
        program.server = program.server || 'localhost';
        // if user just wants to run query then we're not in interactive mode
        this.interactiveMode = program.query === undefined;
        
        if (this.interactiveMode) {
            this.messages.connecting(program.server);
        }        
        this._createWriter(program.format);

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
            return;
        }

        // if output is not in a tabular format then don't write extra messages on console
        this.messages.enabled = this.interactiveMode || (this.writer instanceof ResultWriter.TableWriter);
    };

    SqlCli.prototype._onConnect = function () {
        this.invoker = new Invoker(this.db, this.messages, this.writer);

        if (program.query) {
            this._runCommand(program.query, true);
            return;
        }

        this.messages.connected();
        this.messages.welcome(program.version());

        this.prompt.next();
    };

    SqlCli.prototype._onErrorExit = function ( err ) {
        if ( err ) {
            this._logError( err );
            exit(-1);
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

        this.messages.error(message);
    };

    SqlCli.prototype._runCommand = function (line, thenExit) {
        this.prompt.exit = thenExit;

        if (!line) {
            this.prompt.next();
            return;
        }

        this.invoker.run(line)
            .then(this.prompt.next.bind(this.prompt),
                  this._onErrorNext.bind(this));
    };

    return SqlCli;
})();

module.exports = exports = SqlCli;