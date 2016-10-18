(function () {
    "use strict";

    var _ = require('underscore'),
        _str = require('underscore.string'),    
        Prompt = require('./prompt'),
        MSSQLDbService = require('./mssqldb'),
        Options = require('./options'),
        Commands = require('./commands'),
        ResultWriter = require('./resultwriter'),
        Messages = require('./messages'),
        exit = require('../external/exit');

    _.mixin(_str.exports());

    class SqlCli {
        constructor() {
            this.db = new MSSQLDbService();
            this.messages = new Messages();
            this.options = new Options();
            this.buffer = '';
            this.prompt = new Prompt();
            this.prompt.on('line', this._runCommand.bind(this));
            this.prompt.on('end', exit.bind(null));
        }

        run( argv, env ) {
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
        }

        _createWriter(format) {
            try {
                this.writer = ResultWriter.create(format);
            }
            catch (e) {
                this._onErrorExit(e.message);
                return;
            }

            // if output is not in a tabular format then don't write extra messages on console
            this.messages.enabled = this.messages.interactiveMode || (this.writer instanceof ResultWriter.TableWriter);
        }

        _onConnect() {
            this.invoker = new Commands.Invoker(this.db, this.messages, this.writer);

            if (this.options.args.query) {
                this._runCommand(this.options.args.query, true);
                return;
            }

            this.messages.connected();
            this.messages.welcome(this.options.version);

            this.prompt.next();
        }

        _onConnectError(err) {
            this.messages.connectionerror(err);
            exit(-1);
        }

        _onErrorExit( err ) {
            this.prompt.exit = true;
            this._onErrorNext(err);
        }

        _onErrorNext( err ) {
            if ( err ) {
                this.messages.error( err );
                this.prompt.next(-1);
            }
        }

        _runCommand(line, thenExit) {
            this.prompt.exit = thenExit;

            if (!line) {
                this.prompt.next();
                return;
            }
            else if (Commands.Utils.isContinued(line)) {
                line = Commands.Utils.trimSlash(line);
                this.buffer = Commands.Utils.appendLine(this.buffer, line);            
                return this.prompt.next();
            }

            line = Commands.Utils.appendLine(this.buffer, line);
            this.buffer = '';

            this.invoker.run(line)
                .then(this.prompt.next.bind(this.prompt),
                    this._onErrorNext.bind(this));
        }
    }

    module.exports = exports = SqlCli;

} ());