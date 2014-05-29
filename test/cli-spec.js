var proxyquire =  require('proxyquire').noPreserveCache(),
    Q = require('q'),
    _ = require('underscore'),
    utils = require('./utils');

describe('SqlCli', function() {
    var prompt, dbservice, options, commands, resultWriter, messages, exit, cli;

    function setup() {
        prompt = {
            on: jasmine.createSpy()
        };
        dbservice = {};
        options = {};
        commands = {};
        resultWriter = {};
        messages = {};
        exit = jasmine.createSpy();

        var SqlCli = proxyquire('../lib/cli', {
            './prompt': jasmine.createSpy().andReturn(prompt),
            './dbservice': jasmine.createSpy().andReturn(dbservice),
            './options': jasmine.createSpy().andReturn(options),
            './commands': commands,
            './resultwriter': resultWriter,
            './messages': jasmine.createSpy().andReturn(messages),
            '../external/exit': exit
        });
        cli = new SqlCli();        
    }

    describe('run', function() {
        beforeEach(function() {            
           setup(); 
        });

        it('assumes interactive mode if query is not specified', function() {
            options.args = {};
            testInteractiveMode(true);
        });
        
        it('assumes non-interactive mode if query is specified', function() {
            options.args = { query: '.tables' };
            testInteractiveMode(false);
        });
        
        function testInteractiveMode(expectedValue) {
            options.init = jasmine.createSpy();
            options.getConnectionInfo = jasmine.createSpy().andReturn({});            
            messages.connecting = jasmine.createSpy();
            dbservice.connect = jasmine.createSpy().andReturn(Q());
            
            cli.run([], {});
            
            expect(messages.interactiveMode).toEqual(expectedValue);
        }
    });
});