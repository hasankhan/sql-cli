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
                executor = new FileExecutor(execute, parse),
                buffer = '';

            function execute(cmd) {
                messages.echo(cmd);
                return invoker.run(cmd);
            }

            function parse(line) {
                if (Utils.isContinued(line)) {
                    line = Utils.trimSlash(line);
                    buffer = Utils.appendLine(buffer, line);
                }
                else {
                    buffer = Utils.appendLine(buffer, line);
                    executor.addTask(buffer);
                    buffer = '';
                }
            }

            function onClose() {
                executor.addTask(buffer);
            }

            return executor.start(file, onClose);
        }
    }

    module.exports = exports = ReadCommand;

} ());