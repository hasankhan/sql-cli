(function () {
    "use strict";

    var _str = require('underscore.string');

    function createAll(db) {
        var commands = [];
        Object.keys(module.exports).forEach(function (k) {
            if (_str.endsWith(k, 'Command')) {
                commands.push(new module.exports[k](db));
            }
        });
        return commands;
    }

    module.exports = exports = {
        Invoker: require('./invoker'),
        createAll: createAll,
        AnalyzeCommand: require('./analyze'),
        DatabasesCommand: require('./databases'),
        HelpCommand: require('./help'),
        ListIndexesCommand: require('./indexes'),
        QueryCommand: require('./query'),
        QuitCommand: require('./quit'),
        ReadCommand: require('./read'),
        RunCommand: require('./run'),
        SchemaCommand: require('./schema'),
        TablesCommand: require('./tables'),
        Utils: require('./utils')
    };

} ()); 