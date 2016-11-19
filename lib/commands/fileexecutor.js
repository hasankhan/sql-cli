(function () {
    "use strict";

    var Utils = require('./utils'),
        Q = require('q');

    class FileExecutor {
        constructor(executor, parser) {
            this.executor = executor;
            this.parser = parser;
        }

        start(file, onClose) {
            this.deferred = Q.defer();
            this.reader = Utils.readFile(this.deferred, file);
            this.last = new Q();

            if (this.reader) {
                this.reader.on('error', err => {
                    // if we fail to read, we end the command
                    this.deferred.reject(err);
                });

                this.reader.on('line', line => {
                    if (this.deferred.promise.isFulfilled()) {
                        return;
                    }
                    else {
                        this.parser(line);
                    }
                });

                this.reader.on('close', () => {
                    onClose();

                    this.last.then(() => {
                        if (!this.deferred.promise.isFulfilled()) {
                            this.deferred.resolve();
                        }
                    });
                });
            }

            // when the promise is resolved, close the reader
            this.deferred.promise.finally(() => {
                this.reader.close();
            });

            return  this.deferred.promise;
        }

        addTask(task) {
            if (!task) return;

            this.reader.pause();

            this.last = this.last.then(() => {
                return this.executor(task);
            });

            this.last.then(() => {
                if (!this.deferred.promise.isFulfilled()) {
                    // if executes successfully then resume reading
                    this.reader.resume();
                }
            });

            this.last.catch((err) => {
                if (!this.deferred.promise.isFulfilled()) {
                    // if any statement fails, we end the command
                    this.deferred.reject(err);
                }
            });
        }
    }

    module.exports = exports = FileExecutor;

} ());