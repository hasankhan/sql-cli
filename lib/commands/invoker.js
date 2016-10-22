(function () {
    "use strict";

    var _ = require('underscore'),
        QueryCommand = require('./query');

    class Invoker {
        constructor(db, messages, writer) {
            this.writer = writer;
            this.messages = messages;
            this.commands = require('./index').createAll(db);

            this.default = new QueryCommand(db);
        }

        run(line) {
            var tokens = line.split(' ');

            var cmd = _.findWhere(this.commands, { prefix: tokens[0] });
            if (cmd) {
                return cmd.run(this.messages, this.writer, tokens.splice(1));
            }
            return this.default.run(this.messages, this.writer, line);
        }
    }

    module.exports = exports = Invoker;

} ()); 