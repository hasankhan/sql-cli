var _ = require('underscore'),
    _str = require('underscore.string'),
    colors = require('colors');

_.mixin(_str.exports());

var Messages = (function(){
    function Messages(){
        this.enabled = true;
    }

    Messages.prototype.connecting = function(server) {
        process.stdout.write(_.sprintf('Connecting to %s...', server));
    };

    Messages.prototype.connected = function() {
        console.log('done');
    };

    Messages.prototype.welcome = function(version) {
        console.log();
        console.log('sql-cli version ' + version);
        console.log('Enter ".help" for usage hints.');
    };

    Messages.prototype.error = function(message) {
        console.error( _.sprintf('Error: %s', message).grey);
    };

    Messages.prototype.done = function() {
        console.log('OK');
    };

    Messages.prototype.rowCount = function(rows, elapsed) {
        console.log(_.sprintf('%d row(s) returned in %f ms', rows, elapsed));
        console.log();
    }

    return Messages;
})()

module.exports = exports = Messages;