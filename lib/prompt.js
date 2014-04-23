var readline = require('readline'),
    events = require('events');

var Prompt = (function() {
    function Prompt() {
        events.EventEmitter.call(this);

        // initialize prompt
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        this.rl.setPrompt('mssql> ');
        this.rl.on('line', this.emit.bind(this, 'line'));
    }

    Prompt.prototype.__proto__ = events.EventEmitter.prototype;

    Prompt.prototype.next = function (code) {
        if (this.exit) {
            code = code === undefined ? 0: code;
            this.emit('end', code);
        }
        else {
            process.nextTick(this.rl.prompt.bind(this.rl));
        }
    };

    return Prompt;
})();

module.exports = exports = Prompt;