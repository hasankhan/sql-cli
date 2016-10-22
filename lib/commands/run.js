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
                self = this,
                buffer = '';

            function queueQuery(sql) {
                if (!sql) return;

                last = last.then(function () {
                    messages.echo(sql);
                    return Utils.runQuery(messages, writer, self.db.query.bind(self.db, sql));
                });
            }

            if (reader) {
                reader.on('error', function (err) {
                    deferred.reject(err);
                });

                reader.on('line', function (line) {
                    if (line.trim() === 'GO') {
                        queueQuery(buffer);
                        buffer = '';
                    }
                    else {
                        buffer = Utils.appendLine(buffer, line);
                    }
                });

                reader.on('close', function () {
                    queueQuery(buffer);

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

    module.exports = exports = RunCommand;

} ());