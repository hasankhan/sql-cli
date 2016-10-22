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

                last.then(function(){
                    if (!deferred.promise.isFulfilled()) {
                        // if executes successfully then resume reading
                        reader.resume();
                    }
                });

                last.catch(function (err) {
                    if (!deferred.promise.isFulfilled()) {
                        // if any statement fails, we end the command
                        deferred.reject(err);
                    }                    
                });
            }

            if (reader) {
                reader.on('error', function (err) {
                    // if we fail to read, we end the command
                    deferred.reject(err);
                });

                reader.on('line', function (line) {
                    if (deferred.promise.isFulfilled()) {
                        return;
                    }
                    else if (Utils.isContinued(line)) {
                        line = Utils.trimSlash(line);
                        buffer = Utils.appendLine(buffer, line);
                    }
                    else {
                        buffer = Utils.appendLine(buffer, line);

                        // pause reading more lines
                        // wait for command to finish first
                        reader.pause();

                        queueCommand(buffer);
                        buffer = '';
                    }
                });

                reader.on('close', function () {
                    queueCommand(buffer);

                    last.then(function () {
                        if (!deferred.promise.isFulfilled()) {
                            deferred.resolve();
                        }
                    });
                });
            }

            // when the promise is resolved, close the reader
            deferred.promise.finally(function(){
                reader.close();
            });

            return deferred.promise;
        }
    }

    module.exports = exports = ReadCommand;

} ());