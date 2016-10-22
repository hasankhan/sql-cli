(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q'),
        FileExecutor = require('./fileexecutor');

    class RunCommand {
        constructor(db) {
            this.db = db;
            this.prefix = '.run';
            this.usage = '.run FILENAME';
            this.description = 'Execute the file as a sql script';
        }

        run(messages, writer, args) {
            if (!Utils.validateArgs(args, 1)) {
                return Q.reject('File name not specified');
            }

            var file = args.join(' '),
                Commands = require('./index'),
                invoker = new Commands.Invoker(this.db, messages, writer),
                executor = new FileExecutor(execute, parse),
                buffer = '',
                self = this;

            function execute(script) {
                messages.echo(script);
                return Utils.runQuery(messages, writer, self.db.query.bind(self.db, script));
            }

            function parse (line) {
                if (line.trim() === 'GO') {
                    executor.addTask(buffer);
                    buffer = '';
                }
                else {
                    buffer = Utils.appendLine(buffer, line);
                }
            }

            function onClose() {
                executor.addTask(buffer);
            }

            return executor.start(file, onClose);
        }
    }

    module.exports = exports = RunCommand;

} ());