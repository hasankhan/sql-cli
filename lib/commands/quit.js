(function () {
    "use strict";

    var exit = require('../../external/exit'),
        Q = require('q');

    class QuitCommand {
        constructor() {
            this.prefix = '.quit';
            this.usage = '.quit';
            this.description = 'Exit the cli';
        }

        run() {
            exit(0);
            return new Q();
        }
    }

    module.exports = exports = QuitCommand;

} ());