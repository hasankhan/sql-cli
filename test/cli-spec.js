var proxyquire =  require('proxyquire').noPreserveCache(),
    Q = require('q'),
    _ = require('underscore'),
    utils = require('./utils');

describe('SqlCli', () => {
    var prompt, dbservice, options, invoker, resultWriter, messages, exit, cli, promptEventHandlers;

    function setup() {
        prompt = {
            addCommand: jasmine.createSpy(),
            on: jasmine.createSpy()
        };
        promptEventHandlers = {};
        dbservice = {};
        options = {};
        invoker = { 
            commands: []
        };
        prompt.on.andCallFake((event, handler)=>promptEventHandlers[event]=handler);
        resultWriter = { create: jasmine.createSpy() };
        messages = {};
        exit = jasmine.createSpy();

        var SqlCli = proxyquire('../lib/cli', {
            './prompt': jasmine.createSpy().andReturn(prompt),
            './mssqldb': jasmine.createSpy().andReturn(dbservice),
            './options': jasmine.createSpy().andReturn(options),
            './commands': { Invoker: jasmine.createSpy().andReturn(invoker) },
            './resultwriter': resultWriter,
            './messages': jasmine.createSpy().andReturn(messages),
            '../external/exit': exit
        });
        cli = new SqlCli();        
        
        options.init = jasmine.createSpy().andReturn(Promise.resolve());
        options.getConnectionInfo = jasmine.createSpy().andReturn({});            
        options.args = {};
        messages.connecting = jasmine.createSpy();        
    }

    describe('run', () => {
        beforeEach(() => {            
           setup(); 
        });

        it('assumes interactive mode if query is not specified', done => {
            options.args = {};
            testInteractiveMode(true, done);
        });
        
        it('assumes non-interactive mode if query is specified', done => {
            options.args = { query: '.tables' };
            testInteractiveMode(false, done);
        });
        
        it('exits on connection error', done => {
            var err = jasmine.any(Object);
            dbservice.connect = jasmine.createSpy().andReturn(Q.reject(err));
            messages.connectionerror = jasmine.createSpy();
            
            exit.andCallFake(code => {
                expect(code).toEqual(-1);
                expect(messages.connectionerror).toHaveBeenCalledWith(err);
                done();
            });
            
            cli.run([], {});                       
        });
        
        it('runs the command if specified in query argument', done => {
            var command = '.tables';
            options.args = { query: command };
            dbservice.connect = jasmine.createSpy().andReturn(Q());
            invoker.run = line => {
                expect(line).toEqual(command);
                done();
            };
            
            cli.run([], {});                                  
        });

        it('combines commands if ends with slash', done => {
            options.args = {};            
            dbservice.connect = jasmine.createSpy().andReturn(Q());
            var commands = ['select 1\\', 'from dual'];                
            invoker.run = jasmine.createSpy().andReturn(Q());
            messages.connected = jasmine.createSpy();
            messages.welcome = jasmine.createSpy();

            var nextFuncs = [code => {                
                promptEventHandlers['line'](commands[0]);                
            }, code => {
                promptEventHandlers['line'](commands[1]);                
                expect(invoker.run).toHaveBeenCalledWith('select 1\r\nfrom dual');
                expect(invoker.run.callCount).toEqual(1);
                done();
            }];

            prompt.next = jasmine.createSpy().andCallFake(code => {   
                var impl = nextFuncs.shift();
                impl(code);
            });

            cli.run([], {});
        });

        it('does not exit if command returns an error', done => {
            options.args = {};            
            dbservice.connect = jasmine.createSpy().andReturn(Q());
            var err = new Error();
            var command = '.tables';                
            invoker.run = jasmine.createSpy().andReturn(Q.reject(err));
            messages.connected = jasmine.createSpy();
            messages.welcome = jasmine.createSpy();
            messages.error = jasmine.createSpy();

            var nextFuncs = [code => {                
                promptEventHandlers['line'](command);                
                expect(invoker.run).toHaveBeenCalledWith(command);
            }, code => {
                expect(messages.error).toHaveBeenCalledWith(err);
                expect(code).toEqual(-1);
                done();
            }];

            prompt.next = jasmine.createSpy().andCallFake(code => {   
                var impl = nextFuncs.shift();
                impl(code);
            });

            cli.run([], {});
        });

        function testInteractiveMode(expectedValue, done) {            
            dbservice.connect = jasmine.createSpy().andReturn(Q());
            
            cli.run([], {}).then(()=> {            
                expect(messages.interactiveMode).toEqual(expectedValue);
                done();
            });
        }
    });
});