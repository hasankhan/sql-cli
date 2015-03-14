var proxyquire =  require('proxyquire').noPreserveCache(),
    Q = require('q'),
    _ = require('underscore'),
    Queries = require('../lib/queries');

describe('Invoker', function() {
    var lineByLine, exit, invoker, db, messages, writer;

    beforeEach(function() {
        messages = {};
        lineByLine = {
            on: jasmine.createSpy()
        };
        db = {
            query: jasmine.createSpy().andReturn(Q([]))
        };
        writer = {
            write: jasmine.createSpy()
        };
        exit = jasmine.createSpy();
        var Invoker = proxyquire('../lib/commands', {
            'line-by-line': jasmine.createSpy().andReturn(lineByLine),
            '../external/exit': exit
        }).Invoker;
        invoker = new Invoker(db, messages, writer);
    });

    it('.help returns commands reference', function(done) {
        writer.write.andCallFake(function(items) {
            expect(_.findWhere(items, { command: '.help', description: 'Shows this message' })).toBeDefined();
            expect(_.findWhere(items, { command: '.tables', description: 'Lists all the tables' })).toBeDefined();
            expect(_.findWhere(items, { command: '.databases', description: 'Lists all the databases' })).toBeDefined();
            expect(_.findWhere(items, { command: '.read FILENAME', description: 'Execute commands in a file' })).toBeDefined();
            expect(_.findWhere(items, { command: '.run FILENAME', description: 'Execute the file as a sql script' })).toBeDefined();
            expect(_.findWhere(items, { command: '.schema TABLE', description: 'Shows the schema of a table' })).toBeDefined();
            expect(_.findWhere(items, { command: '.indexes TABLE', description: 'Lists all the indexes of a table' })).toBeDefined();
            expect(_.findWhere(items, { command: '.analyze', description: 'Analyzes the database for missing indexes.' })).toBeDefined();
            expect(_.findWhere(items, { command: '.quit', description: 'Exit the cli' })).toBeDefined();

            done();
        });

        invoker.run('.help');
    });

    it('.tables runs the listTables query', function() {
        invoker.run('.tables');
        expect(db.query).toHaveBeenCalledWith(Queries.listTablesSql());
    });

    it('.databases runs the listDatabases query', function() {
        invoker.run('.databases');
        expect(db.query).toHaveBeenCalledWith(Queries.listDatabasesSql());
    });

    it('.read runs the commands in file', function(done) {
        messages.echo = jasmine.createSpy();

        invoker.run('.read test');

        expect(lineByLine.on).toHaveBeenCalledWith('line', jasmine.any(Function));

        lineCallback = _.find(lineByLine.on.argsForCall, function(args) { return args[0] == 'line'; })[1];
        db.query.andCallFake(function(query) {
            expect(messages.echo).toHaveBeenCalledWith('SELECT *\r\nFROM test');
            expect(query).toEqual('SELECT *\r\nFROM test');
            done();
        });

        lineCallback('SELECT *\\');
        lineCallback('FROM test');
    });

     it('.run runs the queries in file', function(done) {
        messages.echo = jasmine.createSpy();

        invoker.run('.run test');

        expect(lineByLine.on).toHaveBeenCalledWith('line', jasmine.any(Function));

        lineCallback = _.find(lineByLine.on.argsForCall, function(args) { return args[0] == 'line'; })[1];
        endCallback = _.find(lineByLine.on.argsForCall, function(args) { return args[0] == 'end'; })[1];

        db.query.andCallFake(function(query) {
            var sql = 'SELECT *\r\nFROM test';

            expect(messages.echo).toHaveBeenCalledWith(sql);
            expect(query).toEqual(sql);

            done();
        });

        lineCallback('SELECT *');
        lineCallback('FROM test');
        lineCallback('GO');
        endCallback();
    });

    it('.schema runs the getSchema query', function() {
        invoker.run('.schema test');
        expect(db.query).toHaveBeenCalledWith(Queries.getSchemaSql('test'));
    });

    it('.indexes runs the listIndexes query', function() {
        invoker.run('.indexes test');
        expect(db.query).toHaveBeenCalledWith(Queries.listIndexesSql('test'));
    });

    it('.analyze runs the listMissingIndexes query', function() {
        invoker.run('.analyze');
        expect(db.query).toHaveBeenCalledWith(Queries.listMissingIndexesSql());
    });

    it('.quit exits the app', function() {
        invoker.run('.quit');
        expect(exit).toHaveBeenCalled();
    });
});