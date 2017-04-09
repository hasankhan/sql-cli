(function () {
    "use strict";

    var _str = require('underscore.string'),
        readline = require('readline'),
        config = require('./prompt.json');

    const EventEmitter = require('events');

    class Prompt extends EventEmitter {        

        constructor() {
            super();

            this.commands = [];
            // initialize prompt
            this.rl = readline.createInterface({ 
                input: process.stdin, 
                output: process.stdout,
                completer: this._completer.bind(this)
            });
            this.rl.setPrompt(config.prompt);
            this.rl.on('line', line=>this.emit('line', line));
            this.rl.on('close', ()=>this.emit('close'));
        }

        addCommand(command) {
            this.commands.push(command);
        }

        next(code) {
            if (this.exit) {
                code = code === undefined ? 0 : code;
                this.emit('exit', code);
            }
            else {
                setImmediate(this.rl.prompt.bind(this.rl));
            }
        }

        _completer(line) {
            var result = this._matchCommands(line);
            if (result[0].length === 0) {
                result = this._matchKeywords(line);
            }
            return result;               
        }

        _matchCommands(line) {
            var hits = this.commands.filter(c => _str.startsWith(c.prefix, line)).map(c => c.prefix);

            return [hits.length ? hits : [], line];
        }

        _matchKeywords(line) {
            var lastWord = line.substring(line.lastIndexOf(' ') + 1);
            if (!lastWord) return [[],lastWord];

            var wordCase = lastWord.charAt(lastWord.length - 1);
            var caseFix = wordCase === wordCase.toUpperCase() ? String.prototype.toUpperCase : String.prototype.toLowerCase; 
            
            var regex = new RegExp("^" + lastWord, "i");
            var hits = config.keywords
                            .filter(c => regex.test(c))
                            .map(x => caseFix.call(x));
            
            return [hits.length ? hits : [], lastWord];
        }
    }

    module.exports = exports = Prompt;
} ());