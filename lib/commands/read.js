(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q'),
        FileExecutor = require('./fileexecutor');

    class ReadCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.read';
            this.usage = '.read FILENAME';
            this.description = 'Execute commands in a file';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('File name not specified');
            }

            var file = args.join(' '),
                Commands = require('./index'),
                invoker = new Commands.Invoker(this.db, messages, writer),
                buffer = new Commands.Buffer(),
                executor = new FileExecutor(execute, line => buffer.addLine(line));

            buffer.on('command', cmd => executor.addTask(cmd));

            function execute(cmd) {
                messages.echo(cmd);
                return invoker.run(cmd);
            }

            return executor.start(file, ()=> buffer.flush());
        }
    }

    module.exports = exports = ReadCommand;

} ());