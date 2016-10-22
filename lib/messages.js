(function () {
    "use strict";

    var _ = require('underscore'),
        sprintf = require("sprintf-js").sprintf;

    class Messages {
        constructor() {
            this.enabled = true;
            this.interactiveMode = true;
        }

        empty() {
            this._log();
        }

        echo(line) {
            if (this.interactiveMode) {
                this._log(line);
            }
        }

        connecting(server) {
            if (this.interactiveMode) {
                this._write(sprintf('Connecting to %s...', server));
            }
        }

        connected() {
            this._log('done');
        }

        connectionerror(err) {
            if (this.interactiveMode) {
                this.empty();
            }
            this.error(err);
        }

        welcome(version) {
            this._log();
            this._log('sql-cli version ' + version);
            this._log('Enter ".help" for usage hints.');
        }

        error(err) {
            var message = null;
            if (err instanceof Error && err.message) {
                message = err.message;
            }
            else if (err) {
                message = err.toString();
            }
            message = message || 'Unexpected error';

            // we write errors even if disabled
            console.error(sprintf('Error: %s', message));
        }

        done() {
            this._log('OK');
        }

        rowCount(rows, skipLine) {
            if (!skipLine) {
                this._log();
            }
            this._log(sprintf('%d row(s) returned', rows));
        }

        resultsetsEnd(resultsets, elapsed) {
            this._log();
            this._log(sprintf('Executed in %f ms', resultsets, elapsed));
        }

        _write() {
            if (!this.enabled) return;

            process.stdout.write.apply(process.stdout, arguments);
        }

        _log() {
            if (!this.enabled) return;

            console.log.apply(null, arguments);
        }
    }

    module.exports = exports = Messages;
} ());