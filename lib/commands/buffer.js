(function () {
    "use strict";

    var Utils = require('./utils');

    const EventEmitter = require('events');

    class Buffer extends EventEmitter {
        constructor() {
            super();
            
            this.buffer = '';
        }

        addLine(line) {
            let complete = !Utils.isContinued(line);
            
            if (complete) {
                this.buffer = Utils.appendLine(this.buffer, line);
                this.flush();    
            }
            else {
                line = Utils.trimSlash(line);
                this.buffer = Utils.appendLine(this.buffer, line);
            }

            return complete;
        }

        flush() {
            this.emit('command', this.buffer);
            this.buffer = '';
        }
    }

    module.exports = exports = Buffer;

} ()); 