(function () {
    "use strict";

    var readline = require('readline');
    var config = require('./prompt.json'); 
    const EventEmitter = require('events');

    class Prompt extends EventEmitter {        

        constructor() {
            super();

            // initialize prompt
            this.rl = readline.createInterface({ 
                input: process.stdin, 
                output: process.stdout,
                completer: this._completer.bind(this)
            });
            this.rl.setPrompt(config.prompt);
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

        _completer(line) {
            var lastWord = line.substring(line.lastIndexOf(' ') + 1);
            if (!lastWord) return [[],lastWord];

            var wordCase = lastWord.charAt(lastWord.length - 1);
            var caseFix = wordCase === wordCase.toUpperCase() ? String.prototype.toUpperCase : String.prototype.toLowerCase; 
            
            var regex = new RegExp("^" + lastWord, "i");
            var hits = config.keywords
                            .filter(c => { return regex.test(c); })
                            .map(x => { return caseFix.call(x); });
                            
            return [hits.length ? hits : [], lastWord];
        }
    }

    module.exports = exports = Prompt;
} ());