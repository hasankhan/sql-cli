(function () {
    "use strict";

    var readline = require('readline');

    const EventEmitter = require('events');

    class Prompt extends EventEmitter {

        constructor() {
            super();

            // initialize prompt
            this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            this.rl.setPrompt('mssql> ');
            this.rl.on('line', this.emit.bind(this, 'line'));
        }

        next(code) {
            if (this.exit) {
                code = code === undefined ? 0 : code;
                this.emit('end', code);
            }
            else {
                setImmediate(this.rl.prompt.bind(this.rl));
            }
        }
    }

    module.exports = exports = Prompt;
} ());