var _ = require('underscore'),
    _str = require('underscore.string'),    
    Prompt = require('./prompt'),
    DbService = require('./dbservice'),
    Options = require('./options'),
    Invoker = require('./commands').Invoker,
    ResultWriter = require('./resultwriter'),
    Messages = require('./messages'),
    exit = require('../external/exit');

_.mixin(_str.exports());

var SqlCli = (function () {
    function SqlCli() {
        this.db = new DbService();
        this.messages = new Messages();
        this.options = new Options();
        this.prompt = new Prompt();
        this.prompt.on('line', this._runCommand.bind(this));
        this.prompt.on('end', exit.bind(null));
        process.on('uncaughtException', this._onErrorExit.bind(this));
    }

    SqlCli.prototype.run = function ( argv, env ) {
        // parse arguments
        this.options.init(argv, env);
        
        // if user just wants to run query then we're not in interactive mode
        this.messages.interactiveMode = this.options.args.query === undefined;
        this._createWriter(this.options.args.format);
        
        var config = this.options.getConnectionInfo();

        this.messages.connecting(config.server);
        this.db.connect(config)
               .then(this._onConnect.bind(this),
                     this._onConnectError.bind(this));
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
        this.messages.enabled = this.messages.interactiveMode || (this.writer instanceof ResultWriter.TableWriter);
    };

    SqlCli.prototype._onConnect = function () {
        this.invoker = new Invoker(this.db, this.messages, this.writer);

        if (this.options.args.query) {
            this._runCommand(this.options.args.query, true);
            return;
        }

        this.messages.connected();
        this.messages.welcome(this.options.version);

        this.prompt.next();
    };

    SqlCli.prototype._onConnectError = function(err) {
        this.messages.connectionerror(err);
        exit(-1);
    };

    SqlCli.prototype._onErrorExit = function ( err ) {
        if ( err ) {
            this.messages.error( err );
            exit(-1);
        }
    };

    SqlCli.prototype._onErrorNext = function ( err ) {
        if ( err ) {
            this.messages.error( err );
            this.prompt.next(-1);
        }
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