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
            var self = this;

            if (this.reader) {
                this.reader.on('error', err => {
                    // if we fail to read, we end the command
                    self.deferred.reject(err);
                });

                this.reader.on('line', line => {
                    if (self.deferred.promise.isFulfilled()) {
                        return;
                    }
                    else {
                        self.parser(line);
                    }
                });

                this.reader.on('close', () => {
                    onClose();

                    self.last.then(() => {
                        if (!self.deferred.promise.isFulfilled()) {
                            self.deferred.resolve();
                        }
                    });
                });
            }

            // when the promise is resolved, close the reader
            this.deferred.promise.finally(() => {
                self.reader.close();
            });

            return  this.deferred.promise;
        }

        addTask(task) {
            if (!task) return;
            var self = this;

            this.reader.pause();

            this.last = this.last.then(() => {
                return self.executor(task);
            });

            this.last.then(() => {
                if (!self.deferred.promise.isFulfilled()) {
                    // if executes successfully then resume reading
                    self.reader.resume();
                }
            });

            this.last.catch((err) => {
                if (!self.deferred.promise.isFulfilled()) {
                    // if any statement fails, we end the command
                    self.deferred.reject(err);
                }
            });
        }
    }

    module.exports = exports = FileExecutor;

} ());