var _ = require('underscore'),
    _str = require('underscore.string'),
    colors = require('colors');

_.mixin(_str.exports());

var Messages = (function(){
    function Messages(){
        this.enabled = true;
    }

    Messages.prototype.connecting = function(server) {
        this._write(_.sprintf('Connecting to %s...', server));
    };

    Messages.prototype.connected = function() {
        this._log('done');
    };

    Messages.prototype.welcome = function(version) {
        this._log();
        this._log('sql-cli version ' + version);
        this._log('Enter ".help" for usage hints.');
    };

    Messages.prototype.error = function(message) {
        this._error( _.sprintf('Error: %s', message).grey);
    };

    Messages.prototype.done = function() {
        this._log('OK');
    };

    Messages.prototype.rowCount = function(rows, elapsed, skipLine) {
        if (!skipLine) {
            this._log();
        }
        this._log(_.sprintf('%d row(s) returned in %f ms', rows, elapsed));
    };

    Messages.prototype._write = function() {
        if (!this.enabled) return;

        process.stdout.write.apply(process.stdout, arguments);
    };

    Messages.prototype._error = function() {
        // we write errors even if disabled
        console.error.apply(null, arguments);
    };

    Messages.prototype._log = function() {
        if (!this.enabled) return;

        console.log.apply(null, arguments);
    }

    return Messages;
})()

module.exports = exports = Messages;