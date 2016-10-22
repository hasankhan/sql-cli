(function () {
    "use strict";

    var Utils = require('./utils'),
        LineByLineReader = require('line-by-line'),
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
                reader = new LineByLineReader(file),
                last = new Q(),
                self = this,
                buffer = '';

            reader.on('error', function (err) {
                deferred.reject(err);
            });

            function queueQuery(sql) {
                if (!sql) return;

                last = last.then(function () {
                    messages.echo(sql);
                    return Utils.runQuery(messages, writer, self.db.query.bind(self.db, sql));
                });
            }

            reader.on('line', function (line) {
                if (line.trim() === 'GO') {
                    queueQuery(buffer);
                    buffer = '';
                }
                else {
                    buffer = Utils.appendLine(buffer, line);
                }
            });

            reader.on('end', function () {
                queueQuery(buffer);

                last.then(function () {
                    deferred.resolve();
                }, function (err) {
                    deferred.reject(err);
                });
            });

            return deferred.promise;
        }
    }

    module.exports = exports = RunCommand;

} ());