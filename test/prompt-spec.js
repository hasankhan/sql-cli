var proxyquire =  require('proxyquire').noPreserveCache();

describe('Prompt', function() {
    var prompt, rl;

    function setup() {
        rl = {
            setPrompt: jasmine.createSpy(),
            on: jasmine.createSpy()
        };

        var readline = {
            '@noCallThru': true
        };

        readline.createInterface = jasmine.createSpy().andReturn(rl)

        var Prompt = proxyquire('../lib/prompt', {
            'readline': readline
        });

        prompt = new Prompt();
    }

    describe('ctor', function() {
        beforeEach(function() {
            setup();
        });

        it('sets prompt to mssql', function() {
            expect(rl.setPrompt).toHaveBeenCalledWith('mssql> ');
            expect(rl.on).toHaveBeenCalledWith('line', jasmine.any(Function));
        });
    });

    describe('next', function() {
        beforeEach(function() {
            setup();
        });

        it('fires close event if exit is set', function (done) {
            var code = -123;

            prompt.exit = true;
            prompt.on('end', function(exitCode) {
                expect(exitCode).toEqual(code);
                done();
            });

            prompt.next(code);
        });

        it('prompts on next', function (done) {
            rl.prompt = function() {
                done();
            };
            prompt.next();
        });
    });
});