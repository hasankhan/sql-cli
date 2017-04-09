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

    var Invoker = Commands.Invoker,
        Utils = Commands.Utils,
        Buffer = Commands.Buffer,
        Queue = Commands.Queue;

    _.mixin(_str.exports());

    class SqlCli {
        constructor() {
            this.db = new MSSQLDbService();
            this.messages = new Messages();
            this.options = new Options();
            this.buffer = new Buffer();
        }

        run(argv, env, pageSize) {
            // parse arguments
            return this.options.init(argv, env).then(()=>
            {                
                this.messages.pageSize = pageSize;

                // if user just wants to run query then we're not in interactive mode
                this.messages.interactiveMode = this.options.args.query === undefined;
                this._createWriter(this.options.args.format);

                var config = this.options.getConnectionInfo();

                this.messages.connecting(config.server);
                this.db.connect(config)
                    .then(this._onConnect.bind(this),
                    this._onConnectError.bind(this));
            }, err => {
                this.messages.error(err);
                exit(-1);                
            });
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
            this.buffer.on('command', cmd => this.queue.addCommand(cmd));

            this.prompt = new Prompt();
            this.prompt.on('line', line => this._runCommand(line, false /*thenExit*/));
            this.prompt.on('close', ()=> this.queue.end());
            this.prompt.on('exit', code => exit(code));

            this.invoker = new Invoker(this.db, this.messages, this.writer);
            this.invoker.commands.forEach(this.prompt.addCommand.bind(this.prompt));

            this.queue = new Queue(this.invoker, this.prompt, this.messages);

            if (this.options.args.query) {
                this._runCommand(this.options.args.query, true /*thenExit*/);
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

        _onErrorExit(err) {
            this.prompt.exit = true;
            this._onErrorNext(err);
        }

        _onErrorNext(err) {
            if (err) {
                this.messages.error(err);
                this.prompt.next(-1);
            }
        }

        _runCommand(line, thenExit) {
            this.prompt.exit = thenExit;

            // if there is nothing to process
            // or the command is incomplete
            // then prompt for more
            if (!line || !this.buffer.addLine(line)) {
                this.prompt.next();
            }
        }
    }

    module.exports = exports = SqlCli;

} ());