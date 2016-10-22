(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q');

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

            var deferred = Q.defer(),
                file = args.join(),
                Commands = require('./index'),
                invoker = new Commands.Invoker(this.db, messages, writer),
                reader = Utils.readFile(deferred, file),
                last = new Q(),
                buffer = '';

            function queueCommand(cmd) {
                if (!cmd) return;

                last = last.then(function () {
                    messages.echo(cmd);
                    return invoker.run(cmd);
                });
            }

            if (reader) {
                reader.on('error', function (err) {
                    deferred.reject(err);
                });

                reader.on('line', function (line) {
                    if (Utils.isContinued(line)) {
                        line = Utils.trimSlash(line);

                        buffer = Utils.appendLine(buffer, line);
                    }
                    else {
                        buffer = Utils.appendLine(buffer, line);

                        queueCommand(buffer);
                        buffer = '';
                    }
                });

                reader.on('close', function () {
                    queueCommand(buffer);

                    last.then(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.reject(err);
                    });
                });
            }

            return deferred.promise;
        }
    }

    module.exports = exports = ReadCommand;

} ());