var proxyquire =  require('proxyquire').noPreserveCache();

describe('Prompt', () => {
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

    describe('ctor', () => {
        beforeEach(() => {
            setup();
        });

        it('sets prompt to mssql', () => {
            expect(rl.setPrompt).toHaveBeenCalledWith('mssql> ');
            expect(rl.on).toHaveBeenCalledWith('line', jasmine.any(Function));
        });
    });

    describe('next', () => {
        beforeEach(() => {
            setup();
        });

        it('fires exit event if exit is set', done => {
            var code = -123;

            prompt.exit = true;
            prompt.on('exit', exitCode => {
                expect(exitCode).toEqual(code);
                done();
            });

            prompt.next(code);
        });

        it('prompts on next', done => {
            rl.prompt = () => {
                done();
            };
            prompt.next();
        });
    });
});