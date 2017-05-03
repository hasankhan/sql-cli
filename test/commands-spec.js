var proxyquire =  require('proxyquire').noPreserveCache(),
    Q = require('q'),
    _ = require('underscore'),
    Queries = require('../lib/commands/queries'),
    Utils = require('../lib/commands/utils'),
    Invoker = require('../lib/commands').Invoker,
    EventEmitter = require('events');

describe('Invoker', () => {
    var readline, exit, invoker, db, messages, writer, request;

    function mockCommands(invoker, mocks, db, names) {
        names.forEach(name => {
            var CommandType = proxyquire('../lib/commands/' + name, mocks);
            var command = new CommandType(db);
            invoker.commands = _.map(invoker.commands, cmd => {
                return (cmd.constructor.name == command.constructor.name) ? command : cmd;
            });
        });
    }

    beforeEach(() => {
        messages = {};
        request = new EventEmitter();
        readline = {
            on: jasmine.createSpy(),
            pause: jasmine.createSpy(),
            close: jasmine.createSpy()
        };
        db = {
            query: jasmine.createSpy().andReturn(request)
        };
        writer = {
            writeRows: jasmine.createSpy()
        };
        exit = jasmine.createSpy();

        Utils.readFile = jasmine.createSpy().andReturn(readline);

        var mocks = {
            './utils': Utils,
            '../../external/exit': exit
        };

        invoker = new Invoker(db, messages, writer);
        mockCommands(invoker, mocks, db, ['read', 'run', 'quit']);
    });

    it('.help returns commands reference', done => {
        writer.writeRows.andCallFake(items => {
            expect(_.findWhere(items, { command: '.help', description: 'Shows this message' })).toBeDefined();
            expect(_.findWhere(items, { command: '.tables', description: 'Lists all the tables' })).toBeDefined();
            expect(_.findWhere(items, { command: '.databases', description: 'Lists all the databases' })).toBeDefined();
            expect(_.findWhere(items, { command: '.read FILENAME', description: 'Execute commands in a file' })).toBeDefined();
            expect(_.findWhere(items, { command: '.run FILENAME', description: 'Execute the file as a sql script' })).toBeDefined();
            expect(_.findWhere(items, { command: '.schema TABLE', description: 'Shows the schema of a table' })).toBeDefined();
            expect(_.findWhere(items, { command: '.indexes TABLE', description: 'Lists all the indexes of a table' })).toBeDefined();
            expect(_.findWhere(items, { command: '.analyze', description: 'Analyzes the database for missing indexes.' })).toBeDefined();
            expect(_.findWhere(items, { command: '.quit', description: 'Exit the cli' })).toBeDefined();
            expect(_.findWhere(items, { command: '.sprocs', description: 'Lists all the stored procedures' })).toBeDefined();
            expect(_.findWhere(
              items,
              { command: '.search TYPE VALUE',
                description: 'Searches for a value of specific type (col|text)' }
            )).toBeDefined();

            done();
        });

        invoker.run('.help');
    });

    it('.tables runs the listTables query', () => {
        invoker.run('.tables');
        expect(db.query).toHaveBeenCalledWith(Queries.listTablesSql());
    });

    it('.databases runs the listDatabases query', () => {
        invoker.run('.databases');
        expect(db.query).toHaveBeenCalledWith(Queries.listDatabasesSql());
    });

    it('.read runs the commands in file', done => {
        messages.echo = jasmine.createSpy();

        invoker.run('.read test');

        expect(readline.on).toHaveBeenCalledWith('line', jasmine.any(Function));

        lineCallback = _.find(readline.on.argsForCall, args => args[0] == 'line')[1];
        db.query.andCallFake(query => {
            expect(messages.echo).toHaveBeenCalledWith('SELECT *\r\nFROM test');
            expect(query).toEqual('SELECT *\r\nFROM test');
            done();

            return request;
        });

        lineCallback('SELECT *\\');
        lineCallback('FROM test');
    });

     it('.run runs the queries in file', done => {
        messages.echo = jasmine.createSpy();

        invoker.run('.run test');

        expect(readline.on).toHaveBeenCalledWith('line', jasmine.any(Function));

        lineCallback = _.find(readline.on.argsForCall, args => args[0] == 'line')[1];
        endCallback = _.find(readline.on.argsForCall, args => args[0] == 'close')[1];

        db.query.andCallFake(query => {
            var sql = 'SELECT *\r\nFROM test';

            expect(messages.echo).toHaveBeenCalledWith(sql);
            expect(query).toEqual(sql);

            done();

            return request;
        });

        lineCallback('SELECT *');
        lineCallback('FROM test');
        lineCallback('GO');
        endCallback();
    });

    it('.schema runs the getSchema query', () => {
        invoker.run('.schema test');
        expect(db.query).toHaveBeenCalledWith(Queries.getSchemaSql('test'));
    });

    it('.indexes runs the listIndexes query', () => {
        invoker.run('.indexes test');
        expect(db.query).toHaveBeenCalledWith(Queries.listIndexesSql('test'));
    });

    it('.analyze runs the listMissingIndexes query', () => {
        invoker.run('.analyze');
        expect(db.query).toHaveBeenCalledWith(Queries.listMissingIndexesSql());
    });

    it('.quit exits the app', () => {
        invoker.run('.quit');
        expect(exit).toHaveBeenCalled();
    });

    it('.sprocs runs the listSprocsSql query', () => {
        invoker.run('.sprocs');
        expect(db.query).toHaveBeenCalledWith(Queries.listSprocsSql());
    });

    it('.search runs the searchSql query', () => {
        messages.echo = jasmine.createSpy();

        invoker.run('.search text test');
        expect(messages.echo).toHaveBeenCalledWith('Searching...');
        expect(db.query).toHaveBeenCalledWith(Queries.searchSql('test'));
    });

    it('.column runs the getColumnsSql query', () => {
        messages.echo = jasmine.createSpy();

        invoker.run('.search col test');
        expect(messages.echo).toHaveBeenCalledWith('Searching...');
        expect(db.query).toHaveBeenCalledWith(Queries.getColumnsSql('test'));
    });
});
