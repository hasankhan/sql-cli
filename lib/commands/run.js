(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q');

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

            var deferred = Q.defer(),
                file = args.join(),
                Commands = require('./index'),
                invoker = new Commands.Invoker(this.db, messages, writer),
                reader = Utils.readFile(deferred, file),
                last = new Q(),
                buffer = '',
                self = this;

            function queueScript(script) {
                if (!script) return;

                last = last.then(function () {
                    messages.echo(script);
                    return Utils.runQuery(messages, writer, self.db.query.bind(self.db, script));
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
                    else if (line.trim() === 'GO') {
                        // pause reading more lines
                        // wait for command to finish first
                        reader.pause();

                        queueScript(buffer);
                        buffer = '';
                    }
                    else {
                        buffer = Utils.appendLine(buffer, line);
                    }
                });

                reader.on('close', function () {
                    queueScript(buffer);

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

    module.exports = exports = RunCommand;

} ());