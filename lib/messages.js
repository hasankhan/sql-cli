var _ = require('underscore'),
    _str = require('underscore.string');

_.mixin(_str.exports());

var Messages = (function(){
    function Messages(){
        this.enabled = true;
        this.interactiveMode = true;
    }

    Messages.prototype.empty = function() {
        this._log();
    };
    
    Messages.prototype.echo = function(line) {
        if (this.interactiveMode) {
            this._log(line);
        }
    };

    Messages.prototype.connecting = function(server) {
        if (this.interactiveMode) {
            this._write(_.sprintf('Connecting to %s...', server));
        }
    };

    Messages.prototype.connected = function() {
        this._log('done');
    };

    Messages.prototype.connectionerror = function(err) {
        if (this.interactiveMode) {
            this.empty();
        }
        this.error(err);
    };

    Messages.prototype.welcome = function(version) {
        this._log();
        this._log('sql-cli version ' + version);
        this._log('Enter ".help" for usage hints.');
    };

    Messages.prototype.error = function(err) {
        var message = null;
        if (err instanceof Error && err.message) {
            message = err.message;
        }
        else if (err) {
            message = err.toString();
        }
        message = message || 'Unexpected error';

        // we write errors even if disabled
        console.error( _.sprintf('Error: %s', message));
    };

    Messages.prototype.done = function() {
        this._log('OK');
    };

    Messages.prototype.rowCount = function(rows, skipLine) {
        if (!skipLine) {
            this._log();
        }
        this._log(_.sprintf('%d row(s) returned', rows));
    };

    Messages.prototype.resultsetsEnd = function(resultsets, elapsed) {
        this._log();
        this._log(_.sprintf('Executed in %f ms', resultsets, elapsed));  
    };

    Messages.prototype._write = function() {
        if (!this.enabled) return;

        process.stdout.write.apply(process.stdout, arguments);
    };

    Messages.prototype._log = function() {
        if (!this.enabled) return;

        console.log.apply(null, arguments);
    };

    return Messages;
})();

module.exports = exports = Messages;