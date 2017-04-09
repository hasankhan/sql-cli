(function () {
    "use strict";

    var _str = require('underscore.string');

    function createAll(db) {
        var commands = [];
        Object.keys(module.exports).forEach(k => {
            if (_str.endsWith(k, 'Command')) {
                commands.push(new module.exports[k](db));
            }
        });
        return commands;
    }

    module.exports = exports = {
        Invoker: require('./invoker'),
        Buffer: require('./buffer'),
        Queue: require('./queue'),
        createAll: createAll,
        HelpCommand: require('./help'),
        DatabasesCommand: require('./databases'),
        TablesCommand: require('./tables'),
        SprocsCommand: require('./sprocs'),
        SearchCommand: require('./search'),
        IndexesCommand: require('./indexes'),
        ReadCommand: require('./read'),
        RunCommand: require('./run'),
        SchemaCommand: require('./schema'),
        AnalyzeCommand: require('./analyze'),
        QuitCommand: require('./quit'),
        Utils: require('./utils')
    };

} ());
