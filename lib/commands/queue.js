(function () {
    "use strict";

    class Queue {
        constructor(invoker, prompt, messages) {
            this.invoker = invoker;
            this.prompt = prompt;
            this.messages = messages;
            this.commands = [];
            this.errorCode = 0;
        }

        addCommand(cmd) {
            this.commands.push(cmd);
            // if this is the only command
            // then no one else is going to
            // call the next method so call
            // it ourselves here
            if (this.commands.length === 1) {
                this._next();
            }
        }

        end() {
            this.prompt.exit = true;
            // if there is no pending command
            // then next will not be called
            // so call it now
            if (this.commands.length === 0) {
                this._next();
            }
        }

        _next() {
            if (this.commands.length === 0) {
                // now that we're done with all 
                // the pending commands, we can
                // ask for more input from user
                return this.prompt.next(this.errorCode);
            }
            
            let cmd = this.commands[0];
            this.invoker.run(cmd)
                .then(()=> {
                    this.errorCode = 0;
                }, err => {
                    this.messages.error(err);
                    this.errorCode = -1;
                }).finally(()=> {
                    this.commands.shift();
                    this._next();
                });
        }
    }

    module.exports = exports = Queue;

} ()); 